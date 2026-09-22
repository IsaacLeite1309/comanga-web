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
            "!border-l-4 !pr-12 [&[data-type=error]]:!bg-[#fff1f2] [&[data-type=error]]:!text-[#b42318] [&[data-type=error]]:!border-[#fecdd3] [&[data-type=error]]:!border-l-[#ef4444] [&[data-type=error]_[data-title]]:!text-[#b42318] [&_[data-icon]]:!text-red-600 [&_[data-close-button]]:!text-red-600",
          success:
            "!border-l-4 !pr-12 [&[data-type=success]]:!bg-[#effcf3] [&[data-type=success]]:!text-[#237a45] [&[data-type=success]]:!border-[#bbf7d0] [&[data-type=success]]:!border-l-[#22c55e] [&[data-type=success]_[data-title]]:!text-[#237a45] [&_[data-icon]]:!text-green-600 [&_[data-close-button]]:!text-green-600",
          description: "group-[.toast]:text-muted-foreground",
          closeButton:
            "!left-auto !right-3 !top-1/2 !h-9 !w-9 !-translate-y-1/2 !translate-x-0 !border-0 !bg-transparent !text-slate-500 hover:!bg-transparent hover:!text-slate-800 [&>svg]:!h-4 [&>svg]:!w-4 [&>svg]:!stroke-2",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
