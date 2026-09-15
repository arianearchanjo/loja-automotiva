export default function Dashboard() {
  return (
    <div className="px-4 sm:px-0">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
      <div className="bg-surface border border-border shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <p className="text-muted">
            Bem-vindo ao sistema de gestão comercial e financeira.
          </p>
          <p className="mt-2 text-muted">
            Use o menu para acessar cálculos de preço, vendas e análises financeiras.
          </p>
        </div>
      </div>
    </div>
  );
}
