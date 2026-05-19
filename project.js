 const config = { token: "ghp_"+"mSQCh8UYW5v7ggHV1ZDo62NSstG0Qd4XorDM", repo: "fetrasoatanjonait/invest" };
        let currentProject = null;
        let db = { projets: [] };

        window.onload = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const projectId = urlParams.get('id') || sessionStorage.getItem('currentProjectId');
            
            if (!projectId) {
                alert('Aucun projet sélectionné');
                window.location.href = 'index.html';
                return;
            }

            await sync('projet');
            currentProject = db.projets.find(p => p.id == projectId);
            
            if (!currentProject) {
                alert('Projet non trouvé');
                window.location.href = 'index.html';
                return;
            }

            render();
        };

        async function sync(file) {
            try {
                const res = await fetch(`https://api.github.com/repos/${config.repo}/contents/${file}.json`, {
                    headers: { Authorization: `token ${config.token}` }
                });
                if(res.ok) {
                    const data = await res.json();
                    if(file === 'projet') db.projets = JSON.parse(decodeURIComponent(escape(atob(data.content))));
                    else db[file] = JSON.parse(decodeURIComponent(escape(atob(data.content))));
                }
            } catch (e) { console.error("Erreur de synchro", e); }
        }

        function render() {
            if (!currentProject) return;

            // Mettre à jour le titre
            document.getElementById('project-title').innerText = currentProject.nom;
            document.getElementById('project-title-mobile').innerText = currentProject.nom;

            // Afficher le logo si disponible
            const logoContainer = document.getElementById('project-logo-container');
            const logoImg = document.getElementById('project-logo');
            if (currentProject.logo) {
                logoImg.src = currentProject.logo;
                logoContainer.classList.remove('hidden');
            } else {
                logoContainer.classList.add('hidden');
            }

            // Calculs financiers
            const totalFonds = (currentProject.fonds || []).reduce((acc, f) => acc + parseFloat(f.amount || 0), 0);
            const totalDepenses = (currentProject.depenses || []).reduce((acc, d) => acc + parseFloat(d.amount || 0), 0);
            const totalRevenus = (currentProject.revenus || []).reduce((acc, r) => acc + parseFloat(r.amount || 0), 0);
            const soldeFinal = totalFonds + totalRevenus - totalDepenses;

            // Mettre à jour les statistiques
            document.getElementById('total-funds').innerText = totalFonds.toLocaleString() + " Ar";
            document.getElementById('total-expenses').innerText = totalDepenses.toLocaleString() + " Ar";
            document.getElementById('total-revenue').innerText = totalRevenus.toLocaleString() + " Ar";
            document.getElementById('final-balance').innerText = soldeFinal.toLocaleString() + " Ar";
            document.getElementById('project-balance').innerText = soldeFinal.toLocaleString() + " Ar";

            // Mettre à jour les informations
            document.getElementById('project-description').innerText = currentProject.description || 'Aucune description';
            document.getElementById('project-dates').innerText = `Du ${currentProject.dateDebut || '--'} au ${currentProject.dateFin || '--'}`;
            
            document.getElementById('info-start-date').innerText = currentProject.dateDebut || '--';
            document.getElementById('info-end-date').innerText = currentProject.dateFin || 'Non défini';
            document.getElementById('info-creation-date').innerText = currentProject.dateCreation || '--';

            // Calculs des pourcentages
            const fundsUsedPercent = totalFonds > 0 ? ((totalDepenses / totalFonds) * 100).toFixed(1) : 0;
            const revenueVsExpensesPercent = totalDepenses > 0 ? ((totalRevenus / totalDepenses) * 100).toFixed(1) : 0;
            
            document.getElementById('info-funds-used').innerText = fundsUsedPercent + '%';
            document.getElementById('info-revenue-vs-expenses').innerText = revenueVsExpensesPercent + '%';
            
            const statusElement = document.getElementById('info-financial-status');
            if (soldeFinal >= 0) {
                statusElement.innerText = 'Solvable';
                statusElement.className = 'font-bold text-emerald-600';
            } else {
                statusElement.innerText = 'Déficit';
                statusElement.className = 'font-bold text-red-600';
            }

            // Affichage des listes dans la section aperçu - VIDAGE D'ABORD
            const overviewFunds = document.getElementById('overview-funds');
            const overviewExpenses = document.getElementById('overview-expenses');
            const overviewRevenue = document.getElementById('overview-revenue');
            
            if (overviewFunds) {
                overviewFunds.innerHTML = '';
                overviewFunds.innerHTML = (currentProject.fonds || []).map(f => `
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="px-6 py-4">
                            <div class="font-bold text-slate-900">${f.source || 'Non spécifié'}</div>
                        </td>
                        <td class="px-6 py-4 text-slate-500 font-medium text-sm">${f.date}</td>
                        <td class="px-6 py-4">
                            <span class="font-extrabold text-indigo-600 text-sm">+ ${parseFloat(f.amount).toLocaleString()} Ar</span>
                        </td>
                        <td class="px-6 py-4 text-right">
                            ${f.img ? `
                                <button onclick="zoom('${f.img}')" class="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-xs uppercase tracking-wider hover:text-indigo-800">
                                    <i class="fas fa-receipt"></i> Voir
                                </button>` : '<span class="text-slate-300">---</span>'}
                        </td>
                    </tr>
                `).join('');
            }
            
            if (overviewExpenses) {
                overviewExpenses.innerHTML = '';
                overviewExpenses.innerHTML = (currentProject.depenses || []).map(d => `
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="px-6 py-4">
                            <div class="font-bold text-slate-900">${d.description}</div>
                        </td>
                        <td class="px-6 py-4 text-slate-500 font-medium text-sm">${d.date}</td>
                        <td class="px-6 py-4">
                            <span class="font-extrabold text-red-600 text-sm">- ${parseFloat(d.amount).toLocaleString()} Ar</span>
                        </td>
                        <td class="px-6 py-4 text-right">
                            ${d.img ? `
                                <button onclick="zoom('${d.img}')" class="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-xs uppercase tracking-wider hover:text-indigo-800">
                                    <i class="fas fa-receipt"></i> Voir
                                </button>` : '<span class="text-slate-300">---</span>'}
                        </td>
                    </tr>
                `).join('');
            }
            
            if (overviewRevenue) {
                overviewRevenue.innerHTML = '';
                overviewRevenue.innerHTML = (currentProject.revenus || []).map(r => `
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="px-6 py-4">
                            <div class="font-bold text-slate-900">${r.source || 'Non spécifié'}</div>
                        </td>
                        <td class="px-6 py-4 text-slate-500 font-medium text-sm">${r.date}</td>
                        <td class="px-6 py-4">
                            <span class="font-extrabold text-emerald-600 text-sm">+ ${parseFloat(r.amount).toLocaleString()} Ar</span>
                        </td>
                        <td class="px-6 py-4 text-right">
                            ${r.img ? `
                                <button onclick="zoom('${r.img}')" class="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-xs uppercase tracking-wider hover:text-indigo-800">
                                    <i class="fas fa-receipt"></i> Voir
                                </button>` : '<span class="text-slate-300">---</span>'}
                        </td>
                    </tr>
                `).join('');
            }

        }

        const titles = { 
            'overview': 'Aperçu du Projet', 
            'funds': 'Historique des Fonds', 
            'expenses': 'Historique des Dépenses', 
            'revenue': 'Historique des Revenus' 
        };

        function tab(id) {
            document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
            const navBtn = document.getElementById('b-' + id);
            if (navBtn) navBtn.classList.add('active');
            
            const overviewSection = document.getElementById('p-overview');
            const listsContainer = document.getElementById('lists-container');
            const fundsSection = document.getElementById('overview-funds-section');
            const expensesSection = document.getElementById('overview-expenses-section');
            const revenueSection = document.getElementById('overview-revenue-section');
            
            if (overviewSection) overviewSection.classList.add('hidden');
            if (listsContainer) listsContainer.classList.add('hidden');
            if (fundsSection) fundsSection.classList.add('hidden');
            if (expensesSection) expensesSection.classList.add('hidden');
            if (revenueSection) revenueSection.classList.add('hidden');
            
            if (id === 'overview') {
                if (overviewSection) overviewSection.classList.remove('hidden');
                if (listsContainer) listsContainer.classList.remove('hidden');
                if (fundsSection) fundsSection.classList.remove('hidden');
                if (expensesSection) expensesSection.classList.remove('hidden');
                if (revenueSection) revenueSection.classList.remove('hidden');
            } else if (id === 'funds') {
                if (listsContainer) listsContainer.classList.remove('hidden');
                if (fundsSection) fundsSection.classList.remove('hidden');
            } else if (id === 'expenses') {
                if (listsContainer) listsContainer.classList.remove('hidden');
                if (expensesSection) expensesSection.classList.remove('hidden');
            } else if (id === 'revenue') {
                if (listsContainer) listsContainer.classList.remove('hidden');
                if (revenueSection) revenueSection.classList.remove('hidden');
            }
        }

        function zoom(s) { 
            if(s) { 
                document.getElementById('z-img').src = s; 
                document.getElementById('zoom').classList.remove('hidden'); 
            } 
        }

        function toggleSidebar(open) {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (open === undefined) open = !sidebar.classList.contains('open');
            
            if (open) {
                sidebar.classList.add('open');
                overlay.classList.remove('hidden');
                setTimeout(() => { overlay.classList.add('opacity-100'); overlay.classList.remove('opacity-0'); }, 10);
            } else {
                sidebar.classList.remove('open');
                overlay.classList.add('opacity-0');
                overlay.classList.remove('opacity-100');
                setTimeout(() => overlay.classList.add('hidden'), 300);
            }
        }

        function backToMain() {
            window.location.href = 'index.html';
        }