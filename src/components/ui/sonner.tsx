import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-right"
      duration={5000}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast !bg-slate-50 !text-slate-800 !border-slate-200 !shadow-2xl text-base p-4",
          error:
            "!bg-red-50 !text-red-800 !border-red-200 !border-l-4 !border-l-red-500 !pr-12 [&_[data-icon]]:!text-red-600 [&_[data-close-button]]:!text-red-600",
          success:
            "!bg-green-50 !text-green-800 !border-green-200 !border-l-4 !border-l-green-500 !pr-12 [&_[data-icon]]:!text-green-600 [&_[data-close-button]]:!text-green-600",
          description: "group-[.toast]:text-muted-foreground",
          closeButton:
            "!left-auto !right-3 !top-1/2 !h-9 !w-9 !-translate-y-1/2 !translate-x-0 !border-0 !bg-transparent !text-slate-500 hover:!bg-black/5 hover:!text-slate-800 [&>svg]:!h-4 [&>svg]:!w-4",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
