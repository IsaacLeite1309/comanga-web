import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PasswordRecovery from "./PasswordRecovery";
import { api } from "@/services/api";
vi.mock("@/services/api", () => ({ api: { post: vi.fn() } }));
const token = 'a'.repeat(64);
function show(reset = false, value = token) {
  return render(<MemoryRouter initialEntries={[reset ? `/redefinir-senha/${value}` : '/recuperar-senha']}>
    <Routes><Route path="/recuperar-senha" element={<PasswordRecovery />} /><Route path="/redefinir-senha/:token?" element={<PasswordRecovery reset />} /></Routes>
  </MemoryRouter>);
}
beforeEach(() => vi.resetAllMocks());
describe('recuperação de senha', () => {
  it('envia e-mail e exibe somente a resposta neutra', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { message: 'Se houver uma conta apta para este e-mail, enviaremos as instruções de recuperação.' } });
    show(); fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'a@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar instruções' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Se houver uma conta apta');
    expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'a@example.com' });
  });
  it.each([
    ['weak', 'weak', 'Utilize no mínimo'],
    ['Aa1!' + 'é'.repeat(35), 'Aa1!' + 'é'.repeat(35), '72 bytes'],
    ['SenhaNova123!', 'OutraSenha123!', 'As senhas não conferem'],
  ])('recusa senha inválida %s', async (password, confirm, message) => {
    show(true);
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: password } });
    fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: confirm } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(message); expect(api.post).not.toHaveBeenCalled();
  });
  it('recusa token ausente sem expô-lo na interface', async () => {
    show(true, '');
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'SenhaNova123!' } });
    fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'SenhaNova123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Link de redefinição inválido');
  });
  it('redefine a senha e remove campos sensíveis após sucesso', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { message: 'Senha redefinida com sucesso.' } });
    show(true);
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'SenhaNova123!' } });
    fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'SenhaNova123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Senha redefinida');
    expect(api.post).toHaveBeenCalledWith('/auth/reset-password', { token, password: 'SenhaNova123!', confirmPassword: 'SenhaNova123!' });
    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain(token);
  });
  it('limpa o sucesso ao navegar para solicitar novo link', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { message: 'Senha redefinida com sucesso.' } });
    show(true);
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'SenhaNova123!' } });
    fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'SenhaNova123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
    await screen.findByRole('status');
    fireEvent.click(screen.getByRole('link', { name: 'Solicitar novo link' }));
    expect(screen.getByLabelText('E-mail')).toHaveValue('');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('limpa campos e erro ao abrir outro token na mesma rota', () => {
    render(<MemoryRouter initialEntries={['/redefinir-senha/' + token]}>
      <Link to={'/redefinir-senha/' + 'b'.repeat(64)}>Outro link</Link>
      <Routes><Route path="/redefinir-senha/:token" element={<PasswordRecovery reset />} /></Routes>
    </MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'fraca' } });
    fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'fraca' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Outro link' }));
    expect(screen.getByLabelText('Nova senha')).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('mostra falha e permite nova tentativa', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('offline'));
    show(); fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'a@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar instruções' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível concluir');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enviar instruções' })).not.toBeDisabled());
  });
});
