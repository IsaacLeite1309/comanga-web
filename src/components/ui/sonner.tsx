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
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-2xl text-base p-4",
          error:
            "!border-l-4 !border-l-red-500 !pr-12 [&_[data-icon]]:!text-red-400 [&_[data-close-button]]:!text-red-400",
          success:
            "!border-l-4 !border-l-green-500 !pr-12 [&_[data-icon]]:!text-green-400 [&_[data-close-button]]:!text-green-400",
          description: "group-[.toast]:text-muted-foreground",
          closeButton:
            "!left-auto !right-3 !top-1/2 !h-8 !w-8 !-translate-y-1/2 !translate-x-0 !border-0 !bg-transparent !text-muted-foreground hover:!bg-white/10 hover:!text-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
