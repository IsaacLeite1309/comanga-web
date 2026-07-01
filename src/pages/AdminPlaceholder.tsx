interface AdminPlaceholderProps {
  title: string;
}

const AdminPlaceholder = ({ title }: AdminPlaceholderProps) => {
  return (
    <div className="flex-1 px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="mt-3 text-muted-foreground">
          Funcionalidade administrativa em desenvolvimento.
        </p>
      </div>
    </div>
  );
};

export default AdminPlaceholder;
