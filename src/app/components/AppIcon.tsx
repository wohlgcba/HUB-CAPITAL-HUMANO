import {
  IconBell,
  IconAdjustmentsHorizontal,
  IconBuilding,
  IconBriefcase,
  IconBulb,
  IconCalendar,
  IconCertificate,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconClipboardText,
  IconFileDescription,
  IconFiles,
  IconFileText,
  IconHelpCircle,
  IconHome,
  IconLayoutGrid,
  IconEye,
  IconEyeOff,
  IconLock,
  IconLogout,
  IconMail,
  IconMapPin,
  IconPhone,
  IconPresentation,
  IconRefresh,
  IconSearch,
  IconTargetArrow,
  IconUsers,
  IconUsersGroup,
  IconX,
} from "@tabler/icons-react";

const icons = {
  adjustments: IconAdjustmentsHorizontal,
  bell: IconBell,
  building: IconBuilding,
  briefcase: IconBriefcase,
  bulb: IconBulb,
  calendar: IconCalendar,
  certificate: IconCertificate,
  chevronDown: IconChevronDown,
  chevronLeft: IconChevronLeft,
  chevronRight: IconChevronRight,
  clipboard: IconClipboardText,
  fileDescription: IconFileDescription,
  files: IconFiles,
  fileText: IconFileText,
  help: IconHelpCircle,
  home: IconHome,
  grid: IconLayoutGrid,
  eye: IconEye,
  eyeOff: IconEyeOff,
  lock: IconLock,
  logout: IconLogout,
  mail: IconMail,
  mapPin: IconMapPin,
  phone: IconPhone,
  presentation: IconPresentation,
  refresh: IconRefresh,
  search: IconSearch,
  target: IconTargetArrow,
  users: IconUsers,
  usersGroup: IconUsersGroup,
  x: IconX,
};

export type AppIconName = keyof typeof icons;

type AppIconProps = {
  name: AppIconName;
  size?: number;
  stroke?: number;
  className?: string;
};

export function AppIcon({ name, size = 20, stroke = 1.8, className }: AppIconProps) {
  const Icon = icons[name];
  return <Icon size={size} stroke={stroke} className={className} aria-hidden="true" />;
}
