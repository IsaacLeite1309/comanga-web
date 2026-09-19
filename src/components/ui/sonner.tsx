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
            "!bg-red-500 !text-white !border-red-600 [&_[data-close-button]]:!border-white [&_[data-close-button]]:!bg-white [&_[data-close-button]]:!text-red-500 [&_[data-close-button]:hover]:!bg-red-50",
          success:
            "!bg-green-500 !text-white !border-green-600 [&_[data-close-button]]:!border-white [&_[data-close-button]]:!bg-white [&_[data-close-button]]:!text-green-500 [&_[data-close-button]:hover]:!bg-green-50",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
