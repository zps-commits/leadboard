# Post do LinkedIn — português

**Imagens:** `composed/1-cover.png` … `4-build.png`, nessa ordem (4:5).

---

O briefing pedia "um CRM pequeno, com SQLite, e um deploy de demonstração".
As duas coisas se contradizem, e é aí que está a parte interessante.

Um deploy serverless não tem disco que sobreviva. Grave um lead num arquivo
SQLite lá e ele pode não existir na requisição seguinte, porque a próxima
requisição pode cair em outra instância. Nada dá erro. Nada avisa. O lead
simplesmente não está mais lá.

Um CRM que perde um lead sem dizer nada é pior do que nenhum CRM.

Então o LeadBoard tem uma interface de repositório e três implementações:

• SQLite com Drizzle, local, por server actions — a que persiste.
• O navegador do próprio visitante na demonstração hospedada, o que também
garante que ninguém veja o funil de outra pessoa.
• Um store em memória, que os testes usam.

O mesmo contrato de dezesseis testes roda nas três. É isso que torna a
escolha segura em vez de uma bifurcação: o código acima da interface não
sabe para qual store está escrevendo, e se duas divergirem, quem quebra é
um teste, não o funil de alguém.

Isso já se pagou. A busca por texto começou como SQL LIKE de um lado e
comparação sem acento do outro. O LIKE do SQLite só dobra maiúsculas em
ASCII, então "nucleo" acharia "Núcleo Design" em um store e não acharia no
outro.

Mais três decisões que eu defendo:

• Negócios ganhos e perdidos são contados, mas ficam fora do valor do
funil. Dinheiro já decidido não é previsão.
• A taxa de ganho é nula, não zero, enquanto nada foi decidido.
• Arrastar é o atalho, não o mecanismo. Arrastar é inviável no teclado,
desconfortável com leitor de tela e ruim no polegar, então todo card tem um
menu de estágio visível e cada movimento é anunciado numa live region.

O defeito que eu não previ: no celular a versão hospedada rolava 800 pixels
para o lado, em papel em branco, em duas páginas — e todo elemento visível
media dentro da viewport. Os rótulos ocultos são `position: absolute`; sem
ancestral posicionado, escaparam do scroller em que estavam e esticaram o
documento até eles.

Next.js 16 · React 19 · TypeScript · Drizzle · SQLite · Tailwind v4
97 testes · zero violações do axe em cinco rotas e quatro larguras

No ar: https://07-leadboard.vercel.app
Código: https://github.com/zps-commits/leadboard

Projeto de portfólio, não um negócio em operação. Não há autenticação, o
funil de exemplo é inventado e nenhum número de cliente, usuário ou
faturamento é afirmado.

#TypeScript #NextJS #ArquiteturaDeSoftware #Acessibilidade #Frontend
