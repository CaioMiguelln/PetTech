document.addEventListener('DOMContentLoaded', async () => {
	// Caminho/base disponíveis para todo o arquivo
	const path = window.location.pathname.replace(/\\/g, '/');
	const inPages = /\/paginas\//.test(path);
	const BASE = inPages ? '../' : './'; 
	const PAGES = inPages ? '' : 'paginas/'; 

	// Garante favicon para evitar 404 do /favicon.ico sem alterar HTML
	try {
		const hasFavicon = document.querySelector('link[rel="icon"]');
		if (!hasFavicon) {
			const ico = document.createElement('link');
			ico.rel = 'icon';
			ico.type = 'image/png';
			ico.href = BASE + 'assest/content2.png';
			document.head.appendChild(ico);
		}
	} catch (_) { /* noop */ }

	try {
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

	// ===== Integração da página listar.html com a API (sem alterar HTML) =====
	try {
		// Detecta se estamos na página listar.html
		const current = (() => {
			const p = path.split('/').pop() || '';
			return p === '' ? 'index.html' : p.toLowerCase();
		})();

		if (current === 'listar.html') {
			// API já carregada via tag <script> em listar.html
			const API = window.PetTechAPI;
			if (!API) {
				console.error('API não disponível (PetTechAPI)');
				return;
			}

			// Elementos da página
			const tbody = document.querySelector('.pets-table tbody');
			const filtroNome = document.getElementById('filtro-nome');
			const filtroDono = document.getElementById('filtro-dono');
			const filtroIdade = document.getElementById('filtro-idade');
			const filtroEspecie = document.getElementById('filtro-especie');
			const filtroStatus = document.getElementById('filtro-status');
			const btnFiltro = document.querySelector('.btn.aplicar-filtro');

			let allPets = [];

			const speciePlaceholder = (especie) => {
				const e = (especie || '').toLowerCase();
				if (e.includes('gat')) return 'https://via.placeholder.com/50x50?text=Cat';
				if (e.includes('cach') || e.includes('dog')) return 'https://via.placeholder.com/50x50?text=Dog';
				if (e.includes('pass') || e.includes('bird')) return 'https://via.placeholder.com/50x50?text=Bird';
				if (e.includes('coel') || e.includes('rabbit')) return 'https://via.placeholder.com/50x50?text=Rabbit';
				return 'https://via.placeholder.com/50x50?text=Pet';
			};

			const statusClass = (status) => {
				const s = (status || '').toString().toLowerCase().replace(/\s+/g, '');
				if (s.includes('emconsulta')) return 'status-emconsulta';
				if (s.includes('aguard') || s.includes('aguardando')) return 'status-aguardando';
				if (s.includes('atendido')) return 'status-atendido';
				return '';
			};

			const render = (pets) => {
				if (!tbody) return;
				tbody.innerHTML = '';
				for (const pet of pets) {
					const id = pet.id ?? pet.pet_id ?? pet.ID ?? pet.Id ?? '';
					const nome = pet.nome ?? pet.Nome ?? '';
					const especieVal = pet.especie ?? pet.Especie ?? '';
					const racaVal = pet.raca ?? pet.Raca ?? pet['raça'] ?? '';
					const idadeVal = pet.idade ?? pet.Idade ?? '';
					const statusVal = pet.status ?? pet.Status ?? '';
					const cpfVal = pet.cpf ?? pet.CPF ?? '';
					const tr = document.createElement('tr');
					tr.innerHTML = `
						<td data-label="ID">${id}</td>
						<td data-label="Foto"><img src="${speciePlaceholder(especieVal)}" alt="Foto do Pet ${nome}"></td>
						<td data-label="Nome">${nome}</td>
						<td data-label="Espécie">${especieVal || ''}</td>
						<td data-label="Idade">${idadeVal}</td>
						<td data-label="Status" class="status-badge ${statusClass(statusVal)}">${statusVal}</td>
						<td data-label="Dono">${cpfVal}</td>
						<td data-label="Ações">
							<button class="btn editar" data-id="${id}">Editar</button>
							<button class="btn excluir" data-id="${id}">Excluir</button>
						</td>`;
					tbody.appendChild(tr);
				}

				// Liga eventos de ação
				tbody.querySelectorAll('.btn.excluir').forEach((btn) => {
					btn.addEventListener('click', async (e) => {
						const id = e.currentTarget.getAttribute('data-id');
						if (!id) return;
						if (!confirm('Deseja excluir este pet?')) return;
						try {
							await API.deletePet(id);
							await carregar();
							alert('Pet excluído com sucesso.');
						} catch (err) {
							console.error('Erro ao excluir pet', err);
							alert('Falha ao excluir pet.');
						}
					});
				});

				tbody.querySelectorAll('.btn.editar').forEach((btn) => {
					btn.addEventListener('click', async (e) => {
						const id = e.currentTarget.getAttribute('data-id');
						const pet = allPets.find(p => (p.id ?? p.pet_id ?? p.ID ?? '').toString() === (id || '').toString());
						if (!pet) return alert('Pet não encontrado.');

						// prompts simples para edição rápida sem alterar HTML
						const nome = prompt('Nome do pet:', pet.nome ?? pet.Nome ?? '') ?? (pet.nome ?? pet.Nome);
						const especie = prompt('Espécie:', pet.especie ?? pet.Especie ?? '') ?? (pet.especie ?? pet.Especie);
						const raca = prompt('Raça:', pet.raca ?? pet.Raca ?? pet['raça'] ?? '') ?? (pet.raca ?? pet.Raca ?? pet['raça']);
						const idadeStr = prompt('Idade (número):', String(pet.idade ?? pet.Idade ?? '')) ?? String(pet.idade ?? pet.Idade ?? '');
						const idade = Number(idadeStr);
						const status = prompt('Status (emconsulta/aguardando/atendido):', pet.status ?? pet.Status ?? '') ?? (pet.status ?? pet.Status);
						const cpf = prompt('CPF do dono:', pet.cpf ?? pet.CPF ?? '') ?? (pet.cpf ?? pet.CPF);

						// Garante envio de todos os campos exigidos pela API
						const payload = {
							nome: nome || '',
							idade: isNaN(idade) ? Number(pet.idade ?? pet.Idade ?? 0) : idade,
							status: status || '',
							cpf: cpf || '',
							especie: especie || '',
							raca: raca || ''
						};

						console.log('Atualizando pet', id, payload);
						try {
							await API.updatePet(id, payload);
							await carregar();
							alert('Pet atualizado com sucesso.');
						} catch (err) {
							console.error('Erro ao atualizar pet', err);
							// Fallback: alguns serviços não liberam PUT via CORS
							const isNetwork = /Falha de rede|Failed to fetch/i.test(String(err?.message || err));
							if (isNetwork) {
								const ok = confirm('Não foi possível atualizar via PUT (possível limitação de CORS do serviço).\n\nDeseja recriar o registro? O ID será alterado.');
								if (ok) {
									try {
										await API.deletePet(id);
										await API.createPet(payload);
										await carregar();
										alert('Registro recriado com sucesso.');
									} catch (e2) {
										console.error('Falha no fallback (delete+create):', e2);
										alert(e2?.message || 'Falha no fallback (delete+create).');
									}
								}
							} else {
								alert(err?.message || 'Falha ao atualizar pet.');
							}
						}
					});
				});
			};

			const aplicarFiltros = () => {
				const nome = (filtroNome?.value || '').trim().toLowerCase();
				const dono = (filtroDono?.value || '').trim().toLowerCase();
				const idadeMin = Number(filtroIdade?.value || '');
				const especie = (filtroEspecie?.value || 'todos').toLowerCase();
				const status = (filtroStatus?.value || 'todos').toLowerCase();

				let filtered = allPets.slice();
				if (nome) filtered = filtered.filter(p => (p.nome || '').toLowerCase().includes(nome));
				if (dono) filtered = filtered.filter(p => (p.cpf || '').toLowerCase().includes(dono));
				if (!isNaN(idadeMin) && idadeMin > 0) filtered = filtered.filter(p => Number(p.idade || 0) >= idadeMin);
				if (especie !== 'todos') {
					if (especie === 'outros') {
						filtered = filtered.filter(p => {
							const e = (p.especie ?? p.Especie ?? '').toLowerCase();
							return e && e !== 'cachorro' && e !== 'gato';
						});
					} else {
						filtered = filtered.filter(p => (p.especie ?? p.Especie ?? '').toLowerCase() === especie);
					}
				}
				if (status !== 'todos') filtered = filtered.filter(p => (p.status || '').toLowerCase().replace(/\s+/g,'') === status.replace(/\s+/g,''));

				if (!filtered.length) {
					if (tbody) tbody.innerHTML = '<tr><td colspan="8">Nenhum pet encontrado com os filtros aplicados.</td></tr>';
					return;
				}
				render(filtered);
			};

			const carregar = async () => {
				try {
					if (tbody) tbody.innerHTML = '<tr><td colspan="8">Carregando...</td></tr>';
					const data = await API.listPets();
					console.log('Dados recebidos da API /list-pet:', data);
					// Alguns backends retornam {data: [...]} ou diretamente [...]
					allPets = Array.isArray(data) ? data : (data?.data || data?.pets || []);
					if (!Array.isArray(allPets)) allPets = [];
					if (allPets.length === 0) {
						if (tbody) tbody.innerHTML = '<tr><td colspan="8">Nenhum pet encontrado.</td></tr>';
						return;
					}
					aplicarFiltros();
				} catch (err) {
					console.error('Erro ao carregar lista de pets', err);
					if (tbody) tbody.innerHTML = '<tr><td colspan="8">Falha ao carregar dados da API.</td></tr>';
				}
			};

			btnFiltro?.addEventListener('click', aplicarFiltros);
			[filtroNome, filtroDono, filtroIdade, filtroEspecie, filtroStatus].forEach(el => {
				el?.addEventListener('change', aplicarFiltros);
			});

			// Carrega ao entrar na página
			carregar();
		}

		// ===== Integração da página cadastrar.html =====
		if (current === 'cadastrar.html') {
			// API já deve estar disponível (tag direta ou outra página). Se não, carrega fallback.
			if (!window.PetTechAPI) {
				await new Promise((resolve, reject) => {
					const s = document.createElement('script');
					s.src = BASE + 'api.js';
					s.async = true;
					s.onload = () => resolve();
					s.onerror = () => reject(new Error('Falha ao carregar api.js'));
					document.head.appendChild(s);
				});
			}
			const API = window.PetTechAPI;
			if (!API) throw new Error('API não disponível');

			const form = document.getElementById('formPet');
			if (!form) return;

			form.addEventListener('submit', async (e) => {
				e.preventDefault();
				const btn = form.querySelector('button[type="submit"]');
				if (btn) btn.disabled = true;

				try {
					const nome = document.getElementById('pet-nome')?.value?.trim();
					const especie = document.getElementById('pet-especie')?.value?.trim();
					const raca = document.getElementById('pet-raca')?.value?.trim();
					const idadeRaw = document.getElementById('pet-idade')?.value?.trim();
					const idade = idadeRaw ? Number(idadeRaw) : undefined;
					const donoCpf = document.getElementById('dono-cpf')?.value?.trim();

					// Status inicial: aguardando atendimento (pode ser ajustado)
					const status = 'aguardando';

					// Validações simples
					if (!nome) throw new Error('Nome do pet é obrigatório');
					if (!donoCpf) throw new Error('CPF do dono é obrigatório');
					if (idade !== undefined && (isNaN(idade) || idade < 0)) throw new Error('Idade inválida');

					const payload = { nome, especie, raca, idade: idade ?? 0, cpf: donoCpf, status };

					await API.createPet(payload);
					alert('Pet cadastrado com sucesso!');
					form.reset();
				} catch (err) {
					console.error('Erro ao cadastrar pet', err);
					alert(err?.message || 'Falha ao cadastrar pet');
				} finally {
					if (btn) btn.disabled = false;
				}
			});
		}
	} catch (err) {
		console.error('Erro ao inicializar integração da lista:', err);
	}
});
