import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "font-['Archivo',sans-serif] !rounded-[10px] !border-[#D7E0E7] !shadow-[0_14px_40px_rgba(6,42,67,0.18)]",
          title: "!font-extrabold",
          description: "!font-semibold",
        },
      }}
    />
  );
}
