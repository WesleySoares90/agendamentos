import React, { useState } from 'react';
import { UserCog, Plus, Trash2 } from 'lucide-react';

const AdminUsersSettings = () => {
  // Mock de dados. No futuro, você substituirá isso por uma chamada ao seu backend (Firebase).
  const [admins, setAdmins] = useState([
    { id: 1, name: 'Admin Teste', email: 'admin@exemplo.com', role: 'Super Admin' },
    { id: 2, name: 'Gerente Joana', email: 'joana@exemplo.com', role: 'Gerente' },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', role: 'Gerente' });

  const handleAddAdmin = (e) => {
    e.preventDefault();
    // Lógica para adicionar o novo admin no backend
    // Por enquanto, estamos apenas simulando a adição ao estado local
    const newId = admins.length > 0 ? Math.max(...admins.map(a => a.id)) + 1 : 1;
    setAdmins([...admins, { ...newAdmin, id: newId }]);
    setNewAdmin({ name: '', email: '', role: 'Gerente' }); // Limpa o formulário
    setShowAddForm(false); // Esconde o formulário
    alert('Novo administrador adicionado com sucesso!');
  };

  const handleDeleteAdmin = (adminId) => {
    // Impede a exclusão do primeiro admin para segurança
    if (adminId === 1) {
      alert('O administrador principal não pode ser removido.');
      return;
    }
    if (window.confirm('Tem certeza que deseja remover o acesso deste administrador?')) {
      // Lógica para remover o admin no backend
      setAdmins(admins.filter(admin => admin.id !== adminId));
      alert('Administrador removido.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <UserCog className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Gestão de Administradores</h2>
            <p className="text-sm text-gray-600">Adicione ou remova usuários com acesso ao painel.</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
        >
          <Plus className="h-5 w-5" />
          Adicionar Admin
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddAdmin} className="space-y-4 p-4 bg-gray-50 rounded-lg mb-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Adicionar Novo Administrador</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Nome completo"
              value={newAdmin.name}
              onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="email"
              placeholder="E-mail"
              value={newAdmin.email}
              onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            <select
              value={newAdmin.role}
              onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Gerente">Gerente</option>
              <option value="Super Admin">Super Admin</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
            <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancelar</button>
          </div>
        </form>
      )}

      {/* LISTA DE ADMINISTRADORES */}
      <div className="space-y-3">
        {admins.map(admin => (
          <div key={admin.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 gap-3">
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{admin.name}</p>
              <p className="text-sm text-gray-600">{admin.email}</p>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <span className="flex-1 sm:flex-none text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {admin.role}
              </span>
              <button
                onClick={() => handleDeleteAdmin(admin.id)}
                disabled={admin.id === 1} // Desabilita o botão para o admin principal
                className="p-2 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Remover administrador"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUsersSettings;
