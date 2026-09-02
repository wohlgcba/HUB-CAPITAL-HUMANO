import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import readExcelFile from "read-excel-file/node";

const DEFAULT_WORKBOOK = "Directorio Red Enlaces Capital Humano 2026 .xlsx";
const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_NAME = "Admin Hub";
const LINK_TYPE_COLORS = new Map([
  ["Capital Humano", "#8DE2D6"],
  ["Comunicación Interna", "#FFCC00"],
  ["Discapacidad", "#CDB7F6"],
]);

loadEnvFile(path.resolve(".env.local"));
loadEnvFile(path.resolve(".env.admin.local"));

const validateOnly = process.argv.includes("--validate-only");
const dryRun = process.argv.includes("--dry-run");
const workbookArgument = process.argv.find((argument) => argument.startsWith("--file="));
const workbookPath = path.resolve(workbookArgument?.slice("--file=".length) || DEFAULT_WORKBOOK);
const parsed = await parseWorkbook(workbookPath);

printValidationSummary(parsed);

if (validateOnly) {
  process.exit(0);
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const adminApiKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminInitialPassword = process.env.ADMIN_INITIAL_PASSWORD;

if (!supabaseUrl || !adminApiKey || !adminInitialPassword) {
  throw new Error(
    "Faltan SUPABASE_URL/VITE_SUPABASE_URL, SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY o ADMIN_INITIAL_PASSWORD en el entorno administrativo.",
  );
}

const supabase = createClient(supabaseUrl, adminApiKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const result = dryRun
  ? await previewDirectoryImport(supabase, parsed)
  : await importDirectory(supabase, parsed, adminInitialPassword);

console.log(dryRun ? "IMPORT_PREVIEW" : "IMPORT_COMPLETE", JSON.stringify(result));

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator < 1) continue;

    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");

    if (process.env[key] === undefined) process.env[key] = value;
  }
}

async function parseWorkbook(filePath) {
  if (!fs.existsSync(filePath)) throw new Error("No se encontró el archivo XLSX del Directorio.");

  const [firstSheet] = await readExcelFile(filePath);
  const sheetName = firstSheet.sheet;
  const rows = firstSheet.data;
  const headerIndex = rows.findIndex((row) => row.includes("Nombre") && row.includes("CUIL"));

  if (headerIndex < 0) throw new Error("El XLSX no contiene los encabezados Nombre y CUIL.");

  const headers = rows[headerIndex].map((value) => normalizeText(value));
  const requiredHeaders = ["Área", "Nombre", "CUIL", "Celular", "Mail", "Rol", "Edificio de GCBA", "Tipo de enlace"];

  for (const header of requiredHeaders) {
    if (!headers.includes(header)) throw new Error(`Falta la columna requerida: ${header}.`);
  }

  const sourceRows = rows.slice(headerIndex + 1).filter((row) => row.some((value) => value !== null && value !== ""));
  const rawPeople = sourceRows.flatMap((row) => {
    const record = Object.fromEntries(headers.map((header, index) => [header, row[index]]));
    const fullName = normalizeText(record.Nombre);
    const area = normalizeText(record["Área"]);
    if (!fullName || !area || isPlaceholderName(fullName)) return [];

    const email = normalizeEmail(record.Mail);
    const cuit = normalizeCuit(record.CUIL);

    return [
      {
        area,
        fullName,
        cuit: isValidCuit(cuit) ? cuit : null,
        phone: normalizeNullableText(record.Celular),
        email: isValidEmail(email) ? email : null,
        jobRole: normalizeNullableText(record.Rol),
        building: normalizeNullableText(record["Edificio de GCBA"]),
        organizationPath: area.split("|").map((value) => value.trim()).filter(Boolean).reverse(),
        linkTypes: normalizeText(record["Tipo de enlace"])
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      },
    ];
  });
  const organizationAliases = buildOrganizationAliases(rawPeople);
  const people = rawPeople.map((person) => ({
    ...person,
    organizationPath: person.organizationPath.map((segment) => organizationAliases.get(normalizeKey(segment)) || segment),
  }));

  const emailCounts = countBy(people.filter((person) => person.email), (person) => person.email);
  const cuitCounts = countBy(people.filter((person) => person.cuit), (person) => person.cuit);

  return {
    sheetName,
    sourceRowCount: sourceRows.length,
    skippedRowCount: sourceRows.length - people.length,
    people,
    emailCounts,
    cuitCounts,
    authReadyPeople: people.filter(
      (person) =>
        person.email &&
        person.cuit &&
        emailCounts.get(person.email) === 1 &&
        cuitCounts.get(person.cuit) === 1,
    ),
  };
}

function printValidationSummary(parsedWorkbook) {
  const peopleWithEmail = parsedWorkbook.people.filter((person) => person.email).length;
  const peopleWithCuit = parsedWorkbook.people.filter((person) => person.cuit).length;
  const duplicateEmails = [...parsedWorkbook.emailCounts.values()].filter((count) => count > 1).length;

  console.log(
    "WORKBOOK_VALIDATION",
    JSON.stringify({
      sheet: parsedWorkbook.sheetName,
      sourceRows: parsedWorkbook.sourceRowCount,
      importablePeople: parsedWorkbook.people.length,
      skippedRows: parsedWorkbook.skippedRowCount,
      peopleWithValidEmail: peopleWithEmail,
      peopleWithValidCuit: peopleWithCuit,
      duplicateEmailGroups: duplicateEmails,
      authReadyPeople: parsedWorkbook.authReadyPeople.length,
      organizationRoots: new Set(parsedWorkbook.people.map((person) => person.organizationPath[0])).size,
      organizationUnits: new Set(parsedWorkbook.people.flatMap((person) => person.organizationPath.map((_, index) => organizationPathKey(person.organizationPath.slice(0, index + 1))))).size,
    }),
  );
}

async function previewDirectoryImport(adminClient, parsedWorkbook) {
  const existingPeople = await requireData(
    adminClient.from("directory_people").select("id,cuit,email,area,full_name,is_active"),
    "No se pudo leer el Directorio existente.",
  );
  const matches = matchIncomingPeople(existingPeople, parsedWorkbook.people);
  const matchedIds = new Set(matches.flatMap((match) => match.existing ? [match.existing.id] : []));
  return {
    currentDirectoryPeople: existingPeople.length,
    sourcePeople: parsedWorkbook.people.length,
    toInsert: matches.filter((match) => !match.existing).length,
    toUpdate: matches.filter((match) => match.existing).length,
    matchedBy: Object.fromEntries(countBy(matches, (match) => match.matchType || "new")),
    areaChanges: matches.filter((match) => match.existing && normalizeKey(match.existing.area) !== normalizeKey(match.person.area)).map((match) => ({ name: match.person.fullName, from: match.existing.area, to: match.person.area })),
    newPeople: matches.filter((match) => !match.existing).map((match) => ({ name: match.person.fullName, area: match.person.area })),
    notInWorkbook: existingPeople.filter((person) => !matchedIds.has(person.id)).map((person) => ({ name: person.full_name, area: person.area, active: person.is_active })),
  };
}

async function importDirectory(adminClient, parsedWorkbook, adminPassword) {
  const existingPeople = await requireData(
    adminClient.from("directory_people").select("id,cuit,email,area,full_name,is_active"),
    "No se pudo leer el Directorio existente.",
  );

  const matches = matchIncomingPeople(existingPeople, parsedWorkbook.people);
  const organizationUnitsByPath = await syncOrganizationUnits(adminClient, parsedWorkbook.people);
  const toUpdate = [];
  const toInsert = [];

  for (const { person, existing } of matches) {
    const organizationUnitId = organizationUnitsByPath.get(organizationPathKey(person.organizationPath));
    const payload = toDirectoryPayload(person, existing, organizationUnitId);

    if (existing) toUpdate.push({ ...payload, id: existing.id });
    else toInsert.push(payload);
  }

  const updatedPeople = toUpdate.length
    ? await requireData(
        adminClient
          .from("directory_people")
          .upsert(toUpdate, { onConflict: "id" })
          .select("id,cuit,email,area,full_name"),
        "No se pudieron actualizar los integrantes existentes.",
      )
    : [];
  const insertedPeople = toInsert.length
    ? await requireData(
        adminClient.from("directory_people").insert(toInsert).select("id,cuit,email,area,full_name"),
        "No se pudieron crear los integrantes nuevos.",
      )
    : [];
  const importedPeople = [...updatedPeople, ...insertedPeople];
  const importedByKey = new Map(importedPeople.map((person) => [personKey(person.area, person.full_name), person]));

  const linkTypeNames = [...new Set(parsedWorkbook.people.flatMap((person) => person.linkTypes))];
  const linkTypeRows = linkTypeNames.map((name, index) => ({
    name,
    color: LINK_TYPE_COLORS.get(name) || "#DDE6EC",
    sort_order: (index + 1) * 10,
    is_active: true,
  }));
  const linkTypes = linkTypeRows.length
    ? await requireData(
        adminClient.from("link_types").upsert(linkTypeRows, { onConflict: "name" }).select("id,name"),
        "No se pudieron sincronizar los tipos de enlace.",
      )
    : [];
  const linkTypeByName = new Map(linkTypes.map((linkType) => [linkType.name, linkType.id]));
  const importedIds = importedPeople.map((person) => person.id);

  const matchedExistingIds = new Set(matches.flatMap((match) => match.existing ? [match.existing.id] : []));
  const linkedProfiles = await requireData(
    adminClient.from("profiles").select("directory_person_id").not("directory_person_id", "is", null),
    "No se pudieron identificar las cuentas vinculadas.",
  );
  const linkedPersonIds = new Set(linkedProfiles.map((profile) => profile.directory_person_id));
  const idsToDeactivate = existingPeople
    .filter((person) => person.is_active && !matchedExistingIds.has(person.id) && !linkedPersonIds.has(person.id))
    .map((person) => person.id);
  for (const chunk of chunks(idsToDeactivate, 100)) {
    await requireSuccess(
      adminClient.from("directory_people").update({ is_active: false }).in("id", chunk),
      "No se pudieron desactivar los contactos ausentes del nuevo Directorio.",
    );
  }

  for (const chunk of chunks(importedIds, 100)) {
    await requireSuccess(
      adminClient.from("directory_person_link_types").delete().in("person_id", chunk),
      "No se pudieron reemplazar los tipos de enlace existentes.",
    );
  }

  const personLinkRows = parsedWorkbook.people.flatMap((person) => {
    const imported = importedByKey.get(personKey(person.area, person.fullName));
    if (!imported) return [];
    return person.linkTypes.flatMap((name) => {
      const linkTypeId = linkTypeByName.get(name);
      return linkTypeId ? [{ person_id: imported.id, link_type_id: linkTypeId }] : [];
    });
  });

  if (personLinkRows.length) {
    await requireSuccess(
      adminClient.from("directory_person_link_types").insert(personLinkRows),
      "No se pudieron asignar los tipos de enlace.",
    );
  }

  const authUsers = await listAllAuthUsers(adminClient);
  const authByEmail = new Map(authUsers.filter((user) => user.email).map((user) => [user.email.toLowerCase(), user]));
  const existingProfiles = await requireData(
    adminClient.from("profiles").select("id,email,auth_user_id,role,must_change_password"),
    "No se pudieron leer los perfiles existentes.",
  );
  const profileByEmail = new Map(existingProfiles.map((profile) => [profile.email.toLowerCase(), profile]));
  let directoryAuthCreated = 0;

  for (const person of parsedWorkbook.authReadyPeople) {
    const directoryPerson = importedByKey.get(personKey(person.area, person.fullName));
    if (!directoryPerson || !person.email || !person.cuit) continue;

    const existingAuthUser = authByEmail.get(person.email);
    const existingProfile = profileByEmail.get(person.email);
    const profilePayload = {
      directory_person_id: directoryPerson.id,
      cuit: person.cuit,
      email: person.email,
      full_name: person.fullName,
      role: existingProfile?.role || "user",
      must_change_password: existingProfile?.must_change_password ?? true,
      is_active: true,
      auth_user_id: existingAuthUser?.id || existingProfile?.auth_user_id || null,
    };

    const profile = existingProfile
      ? await requireSingle(
          adminClient.from("profiles").update(profilePayload).eq("id", existingProfile.id).select("id").single(),
          "No se pudo actualizar un perfil de usuario.",
        )
      : await requireSingle(
          adminClient.from("profiles").insert(profilePayload).select("id").single(),
          "No se pudo crear un perfil de usuario.",
        );

    if (!existingAuthUser) {
      const { data, error } = await adminClient.auth.admin.createUser({
        email: person.email,
        password: person.cuit,
        email_confirm: true,
        user_metadata: { full_name: person.fullName },
      });
      if (error || !data.user) throw safeError("No se pudo crear un usuario del Directorio.", error);

      await requireSuccess(
        adminClient.from("profiles").update({ auth_user_id: data.user.id }).eq("id", profile.id),
        "No se pudo vincular un usuario con su perfil.",
      );
      authByEmail.set(person.email, data.user);
      directoryAuthCreated += 1;
    }
  }

  const adminResult = await provisionAdmin(adminClient, authByEmail, profileByEmail, adminPassword);

  return {
    directoryInserted: insertedPeople.length,
    directoryUpdated: updatedPeople.length,
    directoryAuthEligible: parsedWorkbook.authReadyPeople.length,
    directoryAuthCreated,
    organizationUnits: organizationUnitsByPath.size,
    directoryDeactivated: idsToDeactivate.length,
    admin: adminResult,
  };
}

async function syncOrganizationUnits(adminClient, people) {
  const unitsByPath = new Map();
  const paths = [...new Map(people.flatMap((person) => person.organizationPath.map((_, index) => {
    const segments = person.organizationPath.slice(0, index + 1);
    return [organizationPathKey(segments), segments];
  }))).values()].sort((first, second) => first.length - second.length || organizationPathKey(first).localeCompare(organizationPathKey(second), "es-AR"));

  for (let depth = 1; depth <= 3; depth += 1) {
    const levelPaths = paths.filter((segments) => segments.length === depth);
    if (!levelPaths.length) continue;
    const rows = levelPaths.map((segments) => ({
      name: segments.at(-1),
      short_name: extractOrganizationShortName(segments.at(-1)),
      parent_id: depth === 1 ? null : unitsByPath.get(organizationPathKey(segments.slice(0, -1))),
      depth,
      path_key: organizationPathKey(segments),
      is_active: true,
    }));
    const saved = await requireData(
      adminClient.from("organization_units").upsert(rows, { onConflict: "path_key" }).select("id,path_key"),
      "No se pudo sincronizar la jerarquía organizacional.",
    );
    for (const unit of saved) unitsByPath.set(unit.path_key, unit.id);
  }
  return unitsByPath;
}

async function provisionAdmin(adminClient, authByEmail, profileByEmail, password) {
  const existingAuthUser = authByEmail.get(ADMIN_EMAIL);
  const existingProfile = profileByEmail.get(ADMIN_EMAIL);
  const profilePayload = {
    cuit: null,
    directory_person_id: null,
    email: ADMIN_EMAIL,
    full_name: ADMIN_NAME,
    role: "admin",
    must_change_password: false,
    is_active: true,
    auth_user_id: existingAuthUser?.id || existingProfile?.auth_user_id || null,
  };

  const profile = existingProfile
    ? await requireSingle(
        adminClient.from("profiles").update(profilePayload).eq("id", existingProfile.id).select("id").single(),
        "No se pudo actualizar el perfil administrador.",
      )
    : await requireSingle(
        adminClient.from("profiles").insert(profilePayload).select("id").single(),
        "No se pudo crear el perfil administrador.",
      );

  if (existingAuthUser) return "existing";

  const { data, error } = await adminClient.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password,
    email_confirm: true,
    user_metadata: { full_name: ADMIN_NAME },
  });
  if (error || !data.user) throw safeError("No se pudo crear el usuario administrador.", error);

  await requireSuccess(
    adminClient.from("profiles").update({ auth_user_id: data.user.id }).eq("id", profile.id),
    "No se pudo vincular el administrador con su perfil.",
  );

  return "created";
}

async function listAllAuthUsers(adminClient) {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw safeError("No se pudieron leer los usuarios de Auth.", error);
    users.push(...data.users);
    if (data.users.length < 1000) return users;
  }
}

function toDirectoryPayload(person, existing = null, organizationUnitId = null) {
  return {
    cuit: person.cuit || existing?.cuit || null,
    area: person.area,
    full_name: person.fullName,
    phone: person.phone,
    email: person.email || existing?.email || null,
    job_role: person.jobRole,
    gcba_building: person.building,
    organization_unit_id: organizationUnitId,
    is_active: true,
  };
}

function matchIncomingPeople(existingPeople, incomingPeople) {
  const byCuit = new Map(existingPeople.filter((person) => person.cuit).map((person) => [normalizeCuit(person.cuit), person]));
  const byEmail = new Map(existingPeople.filter((person) => person.email).map((person) => [normalizeEmail(person.email), person]));
  const byName = new Map();
  for (const person of existingPeople) {
    const key = normalizeKey(person.full_name);
    byName.set(key, [...(byName.get(key) || []), person]);
  }

  return incomingPeople.map((person) => {
    const identityMatches = [
      person.cuit ? byCuit.get(person.cuit) : null,
      person.email ? byEmail.get(person.email) : null,
    ].filter(Boolean);
    const distinctIdentityIds = new Set(identityMatches.map((match) => match.id));
    if (distinctIdentityIds.size > 1) {
      throw new Error(`CUIT y mail identifican personas distintas para ${person.fullName}.`);
    }
    if (identityMatches[0]) {
      return { person, existing: identityMatches[0], matchType: person.cuit && byCuit.get(person.cuit)?.id === identityMatches[0].id ? "cuit" : "email" };
    }
    const nameMatches = byName.get(normalizeKey(person.fullName)) || [];
    return { person, existing: nameMatches.length === 1 ? nameMatches[0] : null, matchType: nameMatches.length === 1 ? "unique-name" : "" };
  });
}

function buildOrganizationAliases(people) {
  const aliases = new Map();
  for (const segment of people.flatMap((person) => person.organizationPath)) {
    const abbreviation = extractOrganizationShortName(segment);
    if (abbreviation) aliases.set(normalizeKey(abbreviation), segment);
  }
  return aliases;
}

function extractOrganizationShortName(value) {
  const match = value.match(/\(([^)]+)\)\s*$/);
  return match?.[1]?.trim() || null;
}

function organizationPathKey(segments) {
  return segments.map(normalizeKey).join(" > ");
}

function normalizeKey(value) {
  return normalizeText(value).toLocaleLowerCase("es-AR");
}

function isPlaceholderName(value) {
  return normalizeKey(value) === "no hay enlace";
}

function normalizeText(value) {
  return value === null || value === undefined ? "" : String(value).trim().replace(/\s+/g, " ");
}

function normalizeNullableText(value) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeCuit(value) {
  if (typeof value === "number" && Number.isFinite(value)) return String(Math.trunc(value));
  return normalizeText(value).replace(/\D/g, "");
}

function isValidEmail(value) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

function isValidCuit(value) {
  if (!/^\d{11}$/.test(value)) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const remainder = value
    .slice(0, 10)
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
  const rawCheck = 11 - (remainder % 11);
  const expected = rawCheck === 11 ? 0 : rawCheck === 10 ? 9 : rawCheck;
  return expected === Number(value.at(-1));
}

function personKey(area, fullName) {
  return `${normalizeText(area).toLocaleLowerCase("es-AR")}::${normalizeText(fullName).toLocaleLowerCase("es-AR")}`;
}

function countBy(values, selector) {
  const counts = new Map();
  for (const value of values) {
    const key = selector(value);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function chunks(values, size) {
  const result = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

async function requireData(query, message) {
  const { data, error } = await query;
  if (error || !data) throw safeError(message, error);
  return data;
}

async function requireSingle(query, message) {
  const { data, error } = await query;
  if (error || !data) throw safeError(message, error);
  return data;
}

async function requireSuccess(query, message) {
  const { error } = await query;
  if (error) throw safeError(message, error);
}

function safeError(message, error) {
  const code = error && typeof error === "object" && "code" in error ? ` (${error.code})` : "";
  return new Error(`${message}${code}`);
}
