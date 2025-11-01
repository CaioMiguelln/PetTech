document.addEventListener('DOMContentLoaded', () => {
	try {
		const path = window.location.pathname.replace(/\\/g, '/');
		const inPages = /\/paginas\//.test(path);
		const BASE = inPages ? '../' : './'; 
		const PAGES = inPages ? '' : 'paginas/'; 

		const headerUrl = BASE + 'partials/header.html';
		const footerUrl = BASE + 'partials/footer.html';
		const headerMount = document.getElementById('site-header');
		const footerMount = document.getElementById('site-footer');

			fetch(headerUrl, { cache: 'no-cache' })
			.then((res) => {
				if (!res.ok) throw new Error(`Falha ao carregar header: ${res.status}`);
				return res.text();
			})
			.then((tpl) => {
				const html = tpl
					.replaceAll('{{BASE}}', BASE)
					.replaceAll('{{PAGES}}', PAGES);

				const header = document.createElement('header');
				header.innerHTML = html;

					if (headerMount) {
						headerMount.replaceWith(header);
				} else {
					document.body.prepend(header);
				}

					try {
						const currentUrl = new URL(window.location.href);
						const links = header.querySelectorAll('.menu a');
						const getFile = (u) => {
							const p = new URL(u, currentUrl).pathname.replace(/\\/g, '/');
							let file = p.split('/').pop() || '';
							if (file === '') file = 'index.html';
							return file.toLowerCase();
						};
						const currentFile = getFile(currentUrl.href);
						links.forEach((a) => {
							if (getFile(a.href) === currentFile) a.classList.add('active');
						});
					} catch (_) {  }
			})
					.catch((err) => {
						console.error('Erro ao injetar header:', err);

						try {
							const inline = `
								<nav class="navbar">
									<a class="logobtn" href="${BASE}index.html" aria-label="Ir para início">
										<img src="${BASE}assest/content2.png" alt="Pet-Tech Logo" class="logo">
									</a>
									<ul class="menu">
										<li><a href="${BASE}index.html">Início</a></li>
										<li><a href="${PAGES}listar.html">Listar Pets</a></li>
										<li><a href="${PAGES}cadastrar.html">Cadastrar</a></li>
										<li><a href="${PAGES}login.html">Login</a></li>
										<li><a href="${PAGES}sobre.html">Sobre</a></li>
									</ul>
								</nav>`;
							const header = document.createElement('header');
							header.innerHTML = inline;
						if (headerMount) {
							headerMount.replaceWith(header);
							} else {
								document.body.prepend(header);
							}
						} catch (fallbackErr) {
							console.error('Falha no fallback do header:', fallbackErr);
						}
					});

			fetch(footerUrl, { cache: 'no-cache' })
				.then((res) => {
					if (!res.ok) throw new Error(`Falha ao carregar footer: ${res.status}`);
					return res.text();
				})
				.then((html) => {
					const tmp = document.createElement('div');
					tmp.innerHTML = html;
					const footer = tmp.querySelector('footer') || tmp.firstElementChild;
					if (footerMount) {
						footerMount.replaceWith(footer);
					} else {
						document.body.append(footer);
					}
				})
				.catch((err) => {
					console.error('Erro ao injetar footer:', err);
					try {
						const footer = document.createElement('footer');
						footer.innerHTML = '<p>&copy; 2025 Pet-Tech. Trabalho Integrador de POO e Métodos Ágeis.</p>';
						if (footerMount) {
							footerMount.replaceWith(footer);
						} else {
							document.body.append(footer);
						}
					} catch (fallbackErr) {
						console.error('Falha no fallback do footer:', fallbackErr);
					}
				});
	} catch (err) {
		console.error('Erro inesperado no script de header:', err);
	}
});
