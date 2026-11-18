const supportEmail = "suporte@comanga.com.br";

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
  version: "2026-11-18",
  date: "2026-11-18",
  sections: [
    {
      title: "A quem esta política se aplica",
      paragraphs: [
        "Esta política descreve como o CoMangá trata dados pessoais de visitantes e de pessoas com conta. Você pode consultar as partes públicas do catálogo sem criar uma conta.",
        "Para revisão antes da publicação: confirmar a identidade do controlador, responsável pelas decisões sobre os dados pessoais, e seus dados de contato.",
      ],
    },
    {
      title: "Dados da conta e para que são usados",
      paragraphs: [
        "No cadastro, pedimos nome de usuário, e-mail, data de nascimento e senha. Usamos o nome de usuário para identificar a conta, o e-mail para entrar, ativar a conta e recuperar o acesso, e a data de nascimento declarada para calcular se você tem 18 anos completos antes de habilitar a exibição de conteúdo adulto. A senha é armazenada na forma de um código criptográfico chamado hash.",
        "Para operar a conta, registramos seu identificador interno, data de criação, situação, permissões e preferências, incluindo a opção de exibir conteúdo adulto. Para novos cadastros, registramos junto à conta a versão dos Termos de Uso aceita e a data e hora do aceite.",
        "Ao usar a Coleção ou a Lista de Desejos, registramos os volumes que você adiciona e as marcações de leitura da sua coleção para exibir e atualizar essas listas. A tela Meu perfil, a Coleção e a Lista de Desejos com seus registros ficam na área autenticada da sua conta. Administradores autorizados podem consultar nome de usuário, e-mail, situação e permissões para administrar contas.",
      ],
    },
    {
      title: "Sessão e registros técnicos",
      paragraphs: [
        "O navegador guarda um cookie de sessão para manter você conectado. O servidor guarda o identificador da sessão na forma de hash, com dados sobre sua criação, último uso e encerramento. O navegador também guarda um sinal para sincronizar mudanças de sessão entre abas. Na área administrativa, alguns rascunhos e informações de navegação ficam armazenados na aba.",
        "A API registra dados técnicos como endereço IP, identificador da requisição, método, modelo da rota, código da resposta e tempo de processamento. Esses registros ajudam a investigar falhas e acompanhar o funcionamento do serviço. O endereço IP também é usado para limitar tentativas de login e de recuperação de senha.",
      ],
    },
    {
      title: "Armazenamento e serviços de terceiros",
      paragraphs: [
        "A infraestrutura documentada usa Vercel para entregar o site e encaminhar solicitações à API, Render para executar a API e Neon para armazenar o banco PostgreSQL que contém os registros de conta e das listas pessoais.",
        "A integração de e-mail envia ao Resend o endereço do destinatário, o nome de usuário e a mensagem com o link de ativação ou redefinição. O Cloudflare R2 armazena e entrega as capas do catálogo. A rotina documentada de backup prevê uma cópia do banco em um bucket privado no Cloudflare R2, executada pelo GitHub Actions quando configurada.",
        "Ao carregar o site, seu navegador faz solicitações ao Google Fonts para exibir a fonte da interface. Se você abrir um link de compra, seu navegador acessará a loja externa, que trata as informações daquela visita e da eventual compra conforme sua própria política.",
        "Para revisão antes da publicação: confirmar os serviços ativos, regiões de armazenamento, eventuais transferências internacionais e suas garantias, e a base legal aplicável a cada finalidade.",
      ],
    },
    {
      title: "Validade dos links, retenção e exclusão",
      paragraphs: [
        "O link de ativação vale por 24 horas. O link de redefinição de senha vale por uma hora e pode ser usado uma única vez. A expiração encerra a possibilidade de usar o link. Os registros associados seguem regras de retenção próprias.",
        "Para excluir sua conta, abra Meu perfil, acesse Configurações avançadas, escolha Excluir conta e confirme sua senha atual. Quando a exclusão é concluída, o CoMangá remove do banco ativo a conta e seu registro de aceite, os dados das listas pessoais e os registros de sessão e recuperação vinculados. Todas as sessões da conta são encerradas.",
        "Se a conta for a última com acesso efetivo de administração, o sistema bloqueia a exclusão pelo perfil até que haja outro administrador. As capas incluídas por administradores podem permanecer no catálogo, e o vínculo com a conta excluída é removido do banco ativo.",
        "Cópias de segurança feitas antes da exclusão podem conter dados da conta até serem descartadas. Registros técnicos e informações mantidas por provedores seguem seus próprios prazos.",
        "Para revisão antes da publicação: confirmar os prazos ou critérios de retenção de contas pendentes, aceites, sessões, registros de recuperação, logs, e-mails e backups. Confirmar também como as exclusões são reaplicadas se um backup for restaurado.",
      ],
    },
    {
      title: "Seus direitos e contato",
      paragraphs: [
        "Você pode consultar o nome de usuário e o e-mail cadastrados em Meu perfil e alterar seu nome de usuário e sua senha. Nos casos previstos pela Lei Geral de Proteção de Dados Pessoais (LGPD), você pode solicitar confirmação do tratamento, acesso e correção de dados, informações sobre compartilhamento, bloqueio, anonimização, exclusão ou portabilidade de dados, entre outros direitos.",
        "Escreva para o endereço abaixo para solicitar acesso, correção ou exclusão dos seus dados e tratar de outras questões de privacidade.",
      ],
      contactEmail: supportEmail,
    },
    {
      title: "Crianças e adolescentes",
      paragraphs: [
        "Para revisão antes da publicação: confirmar a política de cadastro e atendimento de crianças e adolescentes, a forma de tratar seus dados e os controles de restrição etária, inclusive para contas administrativas.",
      ],
    },
  ],
};

export const termsOfUse: LegalDocument = {
  title: "Termos de Uso",
  version: "2026-11-18",
  date: "2026-11-18",
  sections: [
    {
      title: "O serviço",
      paragraphs: [
        "O CoMangá oferece um catálogo de mangás físicos para consultar obras, edições, volumes, autores e lançamentos. Com uma conta ativa, você pode organizar sua coleção, marcar volumes lidos e manter uma lista de desejos.",
        "As fichas e datas de lançamento são informativas e podem mudar. Consulte a editora ou a loja para confirmar datas, preços e disponibilidade.",
      ],
    },
    {
      title: "Cadastro e segurança da conta",
      paragraphs: [
        "Para criar uma conta, informe dados corretos e aceite estes Termos de Uso. Para entrar, confirme seu e-mail pelo link de ativação. O CoMangá registra a versão aceita e a data e hora do aceite. A Política de Privacidade descreve como os dados da sua conta são tratados.",
        "Mantenha sua senha em sigilo e utilize apenas a sua conta. Se perder o acesso, use a opção de recuperação de senha. Se suspeitar de uso indevido da conta, entre em contato pelo canal indicado nestes Termos.",
      ],
    },
    {
      title: "Conteúdo adulto",
      paragraphs: [
        "O conteúdo classificado como adulto fica oculto na área pública por padrão. Em contas sem permissão administrativa, o acesso exige login, 18 anos completos conforme a data de nascimento informada e a ativação da preferência em Meu perfil. Contas com permissão administrativa têm acesso para a manutenção do catálogo.",
        "Para revisão antes da publicação: confirmar as regras de cadastro de menores e os controles de acesso a conteúdo com restrição etária.",
      ],
    },
    {
      title: "Uso do catálogo",
      paragraphs: [
        "Respeite os direitos de autores, editoras e outros titulares ao usar informações, capas, imagens e marcas exibidas no catálogo. A exibição desses materiais no CoMangá não transfere direitos sobre eles.",
        "Use apenas as áreas para as quais você tem autorização. É vedado acessar dados de outras contas sem autorização, contornar restrições de acesso ou interferir no funcionamento do serviço.",
      ],
    },
    {
      title: "Links de compra",
      paragraphs: [
        "Quando disponível, o botão de compra abre o site da loja. A loja é responsável pela oferta, preço, pagamento, entrega, trocas e devoluções. Alguns botões podem conter links de afiliados.",
        "Para revisão antes da publicação: confirmar se há comissões por links de afiliados e como essa informação deve aparecer para o usuário.",
      ],
    },
    {
      title: "Encerramento da conta",
      paragraphs: [
        "Para encerrar a conta, abra Meu perfil, acesse Configurações avançadas, escolha Excluir conta e confirme sua senha atual. A exclusão encerra suas sessões e remove a coleção e a lista de desejos do banco ativo. A Política de Privacidade descreve o que pode permanecer em cópias de segurança e registros técnicos.",
        "Se você for o último administrador com acesso efetivo, o sistema bloqueia a exclusão pelo perfil até que haja outro administrador.",
      ],
    },
    {
      title: "Responsável e contato",
      paragraphs: [
        "Use o e-mail abaixo para pedir ajuda com a conta, relatar problemas com o catálogo ou esclarecer dúvidas sobre estes Termos.",
        "Para revisão antes da publicação: confirmar o responsável pelo serviço e como alterações destes Termos serão comunicadas.",
      ],
      contactEmail: supportEmail,
    },
  ],
};
