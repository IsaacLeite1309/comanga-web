const supportEmail = "equipecomanga@gmail.com";

interface LegalDocument {
  title: string;
  version: string;
  date: string;
  sections: {
    title: string;
    paragraphs: string[];
    contactEmail?: string;
  }[];
}

export const privacyPolicy: LegalDocument = {
  title: "Política de Privacidade",
  version: "2026-11-19",
  date: "2026-11-19",
  sections: [
    {
      title: "1. Sua privacidade no CoMangá",
      paragraphs: [
        "O CoMangá permite consultar publicações e organizar coleções pessoais. Esta política explica quais dados usamos nessas atividades, com que finalidade e como você pode exercer seus direitos. Ela se aplica ao site, às contas e às solicitações enviadas ao nosso atendimento.",
        "Você pode consultar o catálogo público sem criar uma conta. Para salvar sua coleção, suas marcações de leitura e sua lista de desejos, é necessário ter uma conta ativa. O contato do CoMangá para questões de privacidade está indicado ao final desta política.",
      ],
    },
    {
      title: "2. Dados da conta e das listas pessoais",
      paragraphs: [
        "No cadastro, solicitamos nome de usuário, e-mail, data de nascimento e senha. O nome identifica sua conta; o e-mail permite entrar, ativar o cadastro e recuperar o acesso; a data de nascimento é utilizada no controle da preferência de conteúdo adulto. A senha é armazenada como hash, e não como texto legível.",
        "Guardamos os volumes adicionados à coleção e aos desejos, as marcações de leitura e as preferências da conta para recuperar essas informações quando você volta ao site ou utiliza outro dispositivo. Também mantemos identificador, situação de ativação, permissões e data de criação da conta. Nos cadastros sujeitos ao aceite, registramos a versão dos Termos aceita e a data e hora do aceite.",
        "Se você escrever para o atendimento, receberemos seu endereço de e-mail e as informações incluídas na mensagem. Não envie senhas nem links de ativação ou recuperação de acesso.",
      ],
    },
    {
      title: "3. Finalidades e fundamentos do tratamento",
      paragraphs: [
        "Usamos os dados necessários para criar e autenticar sua conta, manter suas listas, aplicar preferências, recuperar o acesso e atender às suas solicitações. Essas atividades estão relacionadas à execução do serviço solicitado ao se cadastrar e utilizá-lo.",
        "Dados também podem ser necessários ao cumprimento de obrigações legais e ao exercício de direitos. A segurança e a prevenção de abusos podem se apoiar em interesses legítimos, quando cabível, respeitadas a necessidade do tratamento e as expectativas e os direitos dos titulares. Quando um tratamento depender de consentimento, ele deve ter informação e escolha específicas; aceitar os Termos não representa uma autorização irrestrita para usar seus dados.",
        "Os e-mails de ativação e recuperação têm finalidade operacional. Criar uma conta não significa inscrição em uma lista de publicidade.",
      ],
    },
    {
      title: "4. Quem pode acessar suas informações",
      paragraphs: [
        "A coleção, a lista de desejos e as marcações de leitura ficam vinculadas à sua conta e não são publicadas para outros visitantes. O catálogo apresenta dados das publicações sem identificar quem possui ou deseja cada volume.",
        "Usuários com permissões administrativas podem consultar informações necessárias à gestão das contas, como nome de usuário, e-mail, situação e permissões. Esse acesso deve se limitar às finalidades de suporte, segurança e operação do serviço.",
      ],
    },
    {
      title: "5. Cookies e informações técnicas",
      paragraphs: [
        "Utilizamos um cookie de sessão para reconhecer sua conta após o login. Ele é necessário às funcionalidades autenticadas e não tem finalidade de publicidade personalizada. Você pode sair da conta ou apagar os cookies pelo navegador. Bloquear esse cookie impede o funcionamento normal do login e das listas pessoais.",
        "O navegador também pode armazenar preferências de navegação, um sinal para sincronizar a sessão entre abas e rascunhos de formulários administrativos. Esse sinal não contém sua senha. Apagar os dados locais pode remover preferências e rascunhos, sem excluir a conta ou as listas salvas no servidor.",
        "A API registra informações técnicas, como endereço IP, identificador da requisição, rota acessada, resultado e tempo de resposta. Usamos esses registros para investigar falhas, acompanhar a disponibilidade e limitar tentativas abusivas de acesso. O endereço IP pode ser considerado dado pessoal.",
      ],
    },
    {
      title: "6. Fornecedores e sites externos",
      paragraphs: [
        "A operação utiliza Vercel para hospedar o site, Render para executar a API e Neon para armazenar o banco de dados. O Cloudflare R2 armazena capas e cópias de segurança, e o GitHub Actions executa a rotina de backup. Os registros das contas e das listas pessoais podem constar do banco e dessas cópias.",
        "O Resend recebe o destinatário e os dados necessários ao envio de mensagens de ativação e recuperação. A interface carrega fontes pelo Google Fonts, o que gera uma conexão do navegador com esse fornecedor e pode transmitir informações técnicas da conexão.",
        "Esses fornecedores podem processar ou armazenar dados fora do Brasil, conforme a configuração da infraestrutura e a operação de cada serviço. Eventuais transferências internacionais devem observar os requisitos aplicáveis de proteção de dados. Você pode pedir esclarecimentos pelo nosso canal de contato.",
        "Ao abrir um link de compra, você acessa uma loja externa, como a Amazon. O tratamento de dados dessa visita e da eventual compra segue as regras da loja. O CoMangá não recebe os dados do seu cartão nem processa o pagamento.",
      ],
    },
    {
      title: "7. Segurança e conservação dos dados",
      paragraphs: [
        "O sistema utiliza hash de senhas, tokens de sessão e verificações de permissão. Essas medidas reduzem riscos, mas não permitem garantir segurança absoluta. Use uma senha exclusiva e comunique suspeitas de acesso indevido ao nosso atendimento. Incidentes devem ser avaliados e tratados, inclusive com as comunicações legalmente exigidas quando aplicáveis.",
        "Os dados da conta e das listas são mantidos para prestar o serviço enquanto a conta existir. A expiração de um link de ativação ou recuperação impede seu uso, mas não significa a exclusão automática da conta ou de todos os registros relacionados.",
        "Registros técnicos e de atendimento podem precisar de conservação para segurança, cumprimento de obrigação legal ou exercício de direitos, pelo período necessário à finalidade aplicável. Não há um prazo único para todos os tipos de registro. Pedidos sobre conservação ou exclusão podem ser enviados ao CoMangá.",
      ],
    },
    {
      title: "8. Exclusão da conta",
      paragraphs: [
        "Você pode excluir sua conta em Meu perfil, Configurações avançadas, Excluir conta, confirmando sua senha. A operação remove a conta e os registros vinculados do banco ativo, incluindo coleção, desejos, leitura, aceite e sessões. O sistema impede a exclusão do último administrador efetivo até que exista outro com esse acesso. Se não conseguir usar a opção, procure o atendimento.",
        "Informações do catálogo e capas cadastradas por administradores podem permanecer sem o vínculo com a conta excluída. Backups anteriores à exclusão podem conservar dados até sua substituição ou descarte. A exclusão no site não apaga imediatamente essas cópias, os registros de atendimento ou mensagens já enviadas, que devem observar suas finalidades e as hipóteses legais de conservação.",
      ],
    },
    {
      title: "9. Data de nascimento e menores de idade",
      paragraphs: [
        "A preferência de conteúdo adulto utiliza a idade calculada a partir da data de nascimento informada no cadastro. Esse controle se baseia na declaração do usuário e não representa conferência de documento ou comprovação independente de idade. O conteúdo adulto não é destinado a menores de 18 anos.",
        "O tratamento de dados de crianças e adolescentes deve respeitar seu melhor interesse e as proteções legais específicas. Responsáveis podem entrar em contato sobre dados de menores sob sua responsabilidade, comunicar acesso inadequado ou solicitar a análise de uma conta. Não envie documentos pessoais na primeira mensagem; caso uma confirmação seja necessária, explicaremos o motivo.",
      ],
    },
    {
      title: "10. Seus direitos e contato",
      paragraphs: [
        "Conforme a LGPD, você pode pedir confirmação do tratamento, acesso e correção de seus dados, informações sobre compartilhamento e, quando aplicável, anonimização, bloqueio, eliminação ou portabilidade. Também pode questionar um tratamento e revogar consentimentos eventualmente fornecidos, recebendo informações sobre as consequências dessa escolha.",
        "Escreva para o e-mail abaixo, descrevendo a solicitação e informando o e-mail da conta, quando houver. Poderemos pedir apenas as informações necessárias para confirmar sua identidade e evitar o acesso ou a exclusão de dados de outra pessoa. Os pedidos serão tratados nos prazos legais aplicáveis, considerando as hipóteses legais de conservação. Você também pode procurar a ANPD e os órgãos competentes de defesa dos seus direitos.",
        "A data e a versão no início da página identificam esta política. Mudanças relevantes devem ser comunicadas de forma adequada, sem presumir autorização para novas finalidades incompatíveis com aquelas informadas.",
      ],
      contactEmail: supportEmail,
    },
  ],
};

export const termsOfUse: LegalDocument = {
  title: "Termos de Uso",
  version: "2026-11-19",
  date: "2026-11-19",
  sections: [
    {
      title: "1. O serviço",
      paragraphs: [
        "O CoMangá é uma plataforma de consulta a mangás e publicações relacionadas e de organização de coleções pessoais. O catálogo reúne obras, autores, edições, volumes e lançamentos. Com uma conta ativa, você pode registrar os volumes que possui, marcar os que já leu e organizar os que deseja adquirir.",
        "O cadastro e a organização da coleção são atualmente gratuitos. O CoMangá não vende os exemplares do catálogo, não intermedeia pagamentos e não oferece leitura integral nem download das publicações. Estes Termos regulam o uso da plataforma; a Política de Privacidade explica o tratamento dos dados pessoais.",
      ],
    },
    {
      title: "2. Cadastro e segurança da conta",
      paragraphs: [
        "O catálogo público pode ser consultado sem cadastro. Para usar os recursos pessoais, forneça dados corretos, utilize um e-mail ao qual tenha acesso, aceite os Termos apresentados e ative a conta pelo link enviado. Registramos a versão aceita e o horário do aceite. O link de ativação vale por 24 horas, e o site permite solicitar um novo envio.",
        "Não se passe por outra pessoa nem informe uma data de nascimento falsa para contornar restrições. Mantenha sua senha em sigilo. Caso perca o acesso, use a recuperação de senha; se suspeitar de uso indevido da conta, entre em contato pelo e-mail ao final destes Termos.",
      ],
    },
    {
      title: "3. Coleção, leitura e desejos",
      paragraphs: [
        "As listas são ferramentas de organização pessoal. Marcar um volume como adquirido não comprova compra, propriedade ou autenticidade de um exemplar. Incluí-lo nos desejos não reserva o produto nem garante preço ou disponibilidade.",
        "Ao adicionar à coleção um volume que está nos desejos, ele sai da lista de desejos. A leitura está associada aos volumes da coleção: retirar um volume também remove sua marcação de lido. Confira os avisos de confirmação e o resultado exibido após as alterações.",
      ],
    },
    {
      title: "4. Informações do catálogo",
      paragraphs: [
        "Títulos, sinopses, capas, créditos, dados de edição, datas, preços e status de publicação têm finalidade informativa. Podem existir informações incompletas, atrasadas ou incorretas. Editoras e lojas podem alterar essas informações; antes de comprar, confirme as condições diretamente com elas.",
        "O catálogo é mantido por usuários com permissão administrativa. Uma conta comum não permite alterar fichas ou publicar obras. Para comunicar um erro, envie ao atendimento o link da página e, se possível, uma fonte que ajude a verificar a correção.",
      ],
    },
    {
      title: "5. Conteúdo adulto",
      paragraphs: [
        "O catálogo pode conter capas e informações de publicações classificadas como adultas. Na navegação comum, esse conteúdo fica oculto por padrão. Sua exibição exige uma conta com 18 anos completos conforme a data de nascimento cadastrada e a ativação da preferência correspondente. Contas sem data válida não habilitam essa preferência. O conteúdo adulto não é destinado a menores de 18 anos.",
        "A classificação é informativa e pode precisar de correção. Não procure contornar os controles do serviço; comunique classificações inadequadas ao atendimento. O acesso administrativo a informações restritas é reservado à manutenção do catálogo e não autoriza uso indevido.",
      ],
    },
    {
      title: "6. Uso permitido e proteção do serviço",
      paragraphs: [
        "Utilize a plataforma para consultar o catálogo e organizar seus próprios registros. Não tente acessar contas alheias, obter dados pessoais sem autorização, explorar falhas, inserir conteúdo malicioso, contornar permissões ou executar ações que prejudiquem a disponibilidade do serviço.",
        "As permissões administrativas devem ser usadas apenas nas tarefas autorizadas. O CoMangá pode restringir acessos para conter abuso, proteger contas e cumprir determinações legais. Se acreditar que houve uma restrição indevida, procure o atendimento para pedir esclarecimento e revisão.",
      ],
    },
    {
      title: "7. Direitos sobre obras, capas e marcas",
      paragraphs: [
        "Obras, capas, marcas, personagens e outros materiais apresentados pertencem aos respectivos titulares. A exibição no catálogo não transfere direitos nem autoriza sua reprodução, distribuição ou exploração comercial. O uso desses materiais deve respeitar os direitos autorais e as demais regras aplicáveis.",
        "Titulares ou seus representantes podem comunicar um uso considerado irregular pelo nosso e-mail, incluindo o link da página, a identificação do material e as informações necessárias à análise. O CoMangá avaliará a solicitação e as medidas cabíveis, como correção de crédito ou remoção quando pertinente.",
      ],
    },
    {
      title: "8. Compra em lojas externas",
      paragraphs: [
        "Os botões de compra direcionam a sites externos. A contratação acontece com a loja, que define preço, estoque, pagamento, entrega, trocas e devoluções. O CoMangá não recebe o pagamento nem os dados do seu cartão. Confira a oferta e as condições da loja antes de comprar.",
        "Alguns endereços podem conter identificação de afiliado e gerar comissão ao responsável pelo link, conforme o programa da loja. O botão não garante disponibilidade, não realiza uma compra automática e não altera a natureza informativa do catálogo.",
      ],
    },
    {
      title: "9. Disponibilidade, encerramento e atualizações",
      paragraphs: [
        "O serviço pode sofrer interrupções por manutenção, falhas ou indisponibilidade de fornecedores. Recursos e informações podem ser corrigidos ou atualizados. Não há garantia de funcionamento ininterrupto; as listas não substituem comprovantes de aquisição ou um inventário independente de bens.",
        "Você pode encerrar sua conta em Meu perfil, Configurações avançadas, Excluir conta, confirmando a senha atual. A exclusão encerra as sessões e remove suas listas do banco ativo. A Política de Privacidade explica o tratamento dos registros técnicos, do atendimento e dos backups. O último administrador efetivo precisa que exista outro administrador antes de excluir sua conta.",
        "A data e a versão desta página identificam os Termos. O aceite do cadastro corresponde à versão apresentada naquele momento: uma atualização não significa que todas as contas existentes tenham aceitado automaticamente um novo texto. Mudanças relevantes devem ser comunicadas de forma adequada e, quando necessário, submetidas a novo aceite.",
      ],
    },
    {
      title: "10. Contato e direitos legais",
      paragraphs: [
        "O contato do CoMangá é o e-mail abaixo. Use-o para pedir ajuda com a conta, relatar falhas ou informações incorretas, tratar de direitos sobre materiais e esclarecer estes Termos. Inclua o link da página ou a descrição do problema e evite enviar senhas ou dados pessoais desnecessários.",
        "Estes Termos devem ser interpretados conforme a legislação brasileira e não afastam direitos assegurados por normas obrigatórias, inclusive de proteção de dados e de defesa do consumidor quando aplicáveis.",
      ],
      contactEmail: supportEmail,
    },
  ],
};
