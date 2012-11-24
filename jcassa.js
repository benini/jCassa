window.addEventListener('load', function() {
	new FastClick(document.body); // Caricamento FastClick per iPad
	dyn_dimensions();
	window.onresize=function() { dyn_dimensions(); }

	//TODO: Verificare aggiornamenti ed applicarli
	document.getElementById("pg_aggiornamenti").style.backgroundSize = "100%";
	document.getElementById("pg_aggiornamenti_ok").style.display = "inline";

	preloadImmagini();
	loadProdotti();
	updateTotale();
	document.getElementById("menu").onclick = uiEventLetture;

	var reg_pg_c = 0;
	var reg_pg_i = setInterval(function(){
		reg_pg_c += 4;
		document.getElementById("pg_fiscale").style.backgroundSize = reg_pg_c + "%";
	},200);
	registratore.getInfo(function () {
		clearInterval(reg_pg_i);
		document.getElementById("pg_fiscale_err").style.display = "inline";
		document.getElementById("pg_fiscale").style.backgroundSize = "100%";
		console.log(this.errore);
	});


	/*TODO: Stampante preconto
	if (typeof stampante2 !== "undefined") {
		document.getElementById("schermata_avvio").addChild = etc..
	}
	*/

	return;


	// Calcolo della dimensione della sezione "prezzi" in base alla spazio disponbile
	function dyn_dimensions() {
		// L'idea originale era di creare due classi unknown-width e unknown-height e assegnarle
		// agli oggetti che ne avevano bisogno, ma e' piu' complicato di quanto pensassi senza jQuery
		// e per adesso voglio scrivere puro Javascript per imparare i dettagli
		var dyn_height = window.innerHeight - Math.floor(1.20 * document.getElementById("tot1").offsetHeight);
		var dyn_width = window.innerWidth - Math.floor(1.05 * document.getElementById("tot1").offsetWidth);

		document.getElementById("unknow-width-and-height").style.width = dyn_width;
		document.getElementById("unknow-width-and-height").style.height = dyn_height;
		document.getElementById("unknow-width").style.width = dyn_width;
		document.getElementById("unknow-height").style.height = dyn_height;

		document.getElementById("modalInput").style.width = dyn_width;

		document.getElementById("modalInput").style.height = window.innerHeight;
	}

	function preloadImmagini() {
		var imm = ["img/elimina.png", "img/tot-stampa.gif", "img/pulsante_testo.png"];
		var c = 0
		var buf = [];
		for (var i = 0; i < imm.length; i++) {
			buf[i] = new Image();
			buf[i].onload = function(){
				document.getElementById("pg_immagini").style.backgroundSize = 100 * ++c / imm.length + "%";
				if (c == imm.length) {
					document.getElementById("pg_immagini_ok").style.display = "inline";
				}
			}
			buf[i].src = imm[i];
		}
	}

	function loadProdotti() {
		// Chiedere i prodotti con un xml asyncrono?
		for (var i = 0; i < reparti.length; i++) {
			var divTile = document.createElement("div");
			divTile.className = "metro-tile tile-reparti " + reparti[i].col;
			divTile.innerHTML = reparti[i].reparto;
			divTile.onclick = uiEventCambiaReparto(i);
			document.getElementById('reparti').insertCell(-1).appendChild(divTile);

			document.getElementById("pg_prodotti").style.backgroundSize = 100 * (i+1) / reparti.length + "%";
		}
		document.getElementById("pg_prodotti_ok").style.display = "inline";
	}

}, false);

	function animaClick(tile) {
		tile.className = tile.className.replace(" tile_reset", "");
		tile.className += " tile_middle";
		setTimeout(function() {tile.className = tile.className.replace(" tile_middle", " tile_reset");}, 100);
		var click = document.getElementById("click_snd");
		try { // Sull'Ipad currentTime a volte non funziona (quando il suono e' gia' finito?)
			click.pause();
			click.currentTime = 0;
		} catch (e) {}

		click.play();
	}

	function animaSelezionaRigaScontrino(divTile) {
		var scontr_last_sel = document.getElementById("scontr_selected");
		if (scontr_last_sel) {
			scontr_last_sel.className = scontr_last_sel.className.replace(" tile-scontrino-selected", "");
			scontr_last_sel.id = "";
		}

		if (divTile) {
			divTile.className += " tile-scontrino-selected";
			divTile.id = "scontr_selected";
			divTile.scrollIntoView();
		}
	}


	function uiEventCambiaReparto (r) {
		return function () {
			animaClick(this);
			document.getElementById("schermata_avvio").style.display = "none";
			var div_prodotti=document.getElementById("prezzi");
			while (div_prodotti.hasChildNodes()) { div_prodotti.removeChild(div_prodotti.lastChild); }

			var pr_array = reparti[r].prezzi;
			for (var i=0; i < pr_array.length; i++) {
				var divTile = document.createElement("div");
				divTile.className = "metro-tile " + reparti[r].col + " tile-prezzi";
				divTile.onclick = uiEventAggiungiProdotto(r, i);
				div_prodotti.appendChild(divTile);
				var divDesc = document.createElement("div");
				divDesc.className = "desc "  + reparti[r].col;
				divDesc.innerHTML = pr_array[i].desc;
				divTile.appendChild(divDesc);
				var divPrezzo = document.createElement("div");
				divPrezzo.className = "prezzo";
				if (pr_array[i].prezzo == "") { divPrezzo.innerHTML = ""; }
				else { divPrezzo.innerHTML = "&euro; " + pr_array[i].prezzo; }
				divTile.appendChild(divPrezzo);
			}
		}
	}

	function uiEventAggiungiProdotto(idx_reparto, idx_prezzo) {
		return function () {
			animaClick(this);
			if (! scontrino.isAperto()) {
				document.getElementById("menu").style.display = "none";

				var div_scontr = document.getElementById("scontr");
				while (div_scontr.hasChildNodes()) { div_scontr.removeChild(div_scontr.lastChild);	}

				var tot = document.getElementById("tot1");
				tot.className = tot.className.replace(" tile-totale-menu", " tile-totale-subtotale");
			}

			var prezzo = reparti[idx_reparto].prezzi[idx_prezzo].prezzo;
			var desc = reparti[idx_reparto].prezzi[idx_prezzo].desc;
			var idx = scontrino.push(1 + idx_reparto, 1, desc, prezzo);
			var divTile = document.createElement("div");
			divTile.className = "metro-tile tile-scontrino " + reparti[idx_reparto].col;
			divTile.onclick = uiEventCambiaRigaScontrino;
			document.getElementById("scontr").appendChild(divTile);
			if (prezzo.length < 1) {
				modalInput("ProdottoPrezzo", divTile);
			} else {
				var idx_duplicato = scontrino.unisciDuplicato(idx);
				if (idx_duplicato != -1) {
					document.getElementById("scontr").removeChild(divTile);
					divTile = document.getElementById("scontr").childNodes[idx_duplicato];
				}
			}
			updateTileProdotto(divTile);
		}
	}

	// Prezzo e quantita'
	function updateTileProdotto(tile, quant, prezzo, desc) {
		var idx = 0;

		var tiles = document.getElementById("scontr").childNodes;
		for (; idx < tiles.length && tiles[idx] != tile; ++idx) {}
		if (idx == tiles.length) { console.log("Errore in updateTileProdotto"); return; }

		scontrino.set(idx, quant, prezzo, desc);
/* Questo codice eliminerebbe i duplicati anche se viene cambiato il prezzo in uno uguale;
// e' una finezza, ma mi sembra fuorviante in qualche modo;
// percio' i duplicati vengono eliminati solo in uiEventAggiungiProdotto

		var idx_duplicato = scontrino.unisciDuplicato(idx);
		if (idx_duplicato != -1) {
			document.getElementById("scontr").removeChild(tile);
			tile = tiles[idx_duplicato];
			idx = idx_duplicato;
		}*/

		tile.innerHTML = scontrino.getDesc(idx) + "<br>" + "N. " + scontrino.getQuantita(idx) + "  x  &euro; " + scontrino.getPrezzo(idx);

		animaSelezionaRigaScontrino(tile);

		updateTotale();
	}

	function updateTotale() {
		var tot = document.getElementById("tot1");
		if (scontrino.isAperto()) {
			if (document.getElementById("scontr").childNodes.length > 0) {
				tot.onclick = uiEventChiudiScontrino;
				document.getElementById("tot1_riga1").innerHTML = "SubTotale";
				document.getElementById("tot1_riga2").innerHTML = "&euro; " + scontrino.getTotale();
				return;
			} else {
				scontrino.chiudi();				
			}
		}
		
		tot.onclick = "";
		tot.className = tot.className.replace(" tile-totale-subtotale", " tile-totale-menu");
		tot.className = tot.className.replace(" tile-totale-stampa", " tile-totale-menu");
		document.getElementById("tot1_riga1").innerHTML = "jCassa";
		document.getElementById("tot1_riga2").innerHTML = "v 1.0";

		document.getElementById("menu").style.display = "block";
	}

	function uiEventCambiaRigaScontrino() {
		animaClick(this);
		if (! scontrino.isAperto()) {
			helperRiapriScontrino();
		}
		animaSelezionaRigaScontrino(this);
		modalInput("Prodotto", this);
	}

	function uiEventRiapriScontrino() {
		animaClick(this);
		helperRiapriScontrino();
	}

	function helperRiapriScontrino() {
		scontrino.Riapri();
		var div_scontr = document.getElementById("scontr");
		if (div_scontr.lastChild) { div_scontr.removeChild(div_scontr.lastChild); }
		if (div_scontr.lastChild) { div_scontr.removeChild(div_scontr.lastChild); }

		var tot = document.getElementById("tot1");
		tot.className = tot.className.replace(" tile-totale-stampa", " tile-totale-subtotale");
		updateTotale();
		modalInput("");
	}


	function uiEventChiudiScontrino () {
		if (document.getElementById("modalInputProdotto").style.display == "block") {
			//TODO: Sarebbe meglio chiamare la conferma della finestra modale?
			return;
		}

		animaClick(this);
		var tot = document.getElementById("tot1");
		tot.onclick = uiEventInviaScontrino;
		tot.className = tot.className.replace(" tile-totale-subtotale", " tile-totale-stampa");
		document.getElementById("tot1_riga1").innerHTML = "";
		document.getElementById("tot1_riga2").innerHTML = "STAMPA";

		scontrino.chiudi();

		animaSelezionaRigaScontrino();

		var divTile = document.createElement("div");
		divTile.className = "metro-tile tile-scontrino-totale";
		divTile.onclick = uiEventRiapriScontrino;
		document.getElementById("scontr").appendChild(divTile);
		divTile.innerHTML = "<div style='font-size:18px; margin-bottom: 10px; text-align:center;'>CONTANTI</div>";
		divTile.innerHTML += "TOTALE<br> &euro; " + scontrino.getTotale();

		var divTile = document.createElement("div");
		divTile.className = "metro-tile tile-scontrino-resto";
		divTile.onclick = function () { animaClick(this); modalInput("Resto"); };
		document.getElementById("scontr").appendChild(divTile);
		divTile.innerHTML = "<div style='font-size:18px; margin-bottom: 10px; text-align:center;'>RESTO</div>";
		var i = 0;
		var resti = scontrino.getResto();
		while (i < resti.length) {
			divTile.innerHTML += "<div style='float:left; width: 44%;'> &euro; " + resti[i++] +
			"</div><div style='float:left; width: 20%;'>==></div> &euro; " + resti[i++] + "<br>";
		}
		divTile.scrollIntoView();

		modalInput("Totale");
	}

	function uiEventInviaScontrino() {
		animaClick(this);
		registratore.setCallback(function (message) {
			if (message.length > 4) {
				alert(message);
			}

			if (message.substr(-3, 2) === "OK") {
				updateTotale();
				modalInput("");
				var div_scontr = document.getElementById("scontr");
				for (var i = div_scontr.childNodes.length; i > 2; i--) {
					div_scontr.removeChild(div_scontr.firstChild);
				}
				div_scontr.firstChild.onclick = "";
				div_scontr.firstChild.innerHTML = "<div style='font-size:18px; margin-bottom: 10px; text-align:center;'>ULTIMA VENDITA</div>";
				div_scontr.firstChild.innerHTML += "TOTALE<br> &euro; " + scontrino.getTotale();
				scontrino.invia();
			}
		});
		registratore.stampaScontrino(scontrino);
	}

	function uiEventLetture() {
		animaClick(this);
		modalInput(" Menu");

	}

	var scontrino = {};
	scontrino.id = [];
	scontrino.righe = [];
	scontrino.creaID = function (rep, desc, prezzo) {
		return "r" + rep + "d" + desc + "p" + prezzo;
		}

	scontrino.push = function (rep, quant, desc, prezzo) {
		if (scontrino.id.length != scontrino.righe.length) { scontrino.righe.length = scontrino.id.length; }
		quant = Number(String(quant).replace(",","."));
		prezzo = Number(String(prezzo).replace(",","."));
		scontrino.righe.push({rep: rep, quant: quant, desc: desc, prezzo: prezzo});
		return scontrino.id.push(scontrino.creaID(rep, desc, prezzo)) -1;
	}

	scontrino.elimina = function (idx) {
		scontrino.id.splice(idx, 1);
		scontrino.righe.splice(idx, 1);
	}

	scontrino.set = function (idx, quant, prezzo, desc) {
		if (desc && desc != "") { scontrino.righe[idx].desc = desc; }
		if (quant && quant != "") { scontrino.righe[idx].quant = Number(String(quant).replace(",",".")); }
		if (prezzo && prezzo != "") {
			scontrino.righe[idx].prezzo = Number(String(prezzo).replace(",",".").replace("\u20ac ", "") );
		}
		var riga = scontrino.righe[idx];
		scontrino.id[idx] = scontrino.creaID(riga.rep, riga.desc, riga.prezzo);
	}

	scontrino.getPrezzo = function (idx) {
		return scontrino.righe[idx].prezzo.toFixed(2).replace(".", ",");
	}

	scontrino.getQuantita = function (idx) {
		return String(scontrino.righe[idx].quant).replace(".", ",");
	}

	scontrino.getDesc = function (idx) {
		return scontrino.righe[idx].desc;
	}

	scontrino.getTotale = function () {
		var scontrino_totale = 0;
		for (var i=0; i < scontrino.righe.length; ++i) {
			scontrino_totale += scontrino.righe[i].quant * scontrino.righe[i].prezzo;
		}
		return scontrino_totale.toFixed(2).replace(".", ",");
	}
	scontrino.chiudi = function () {
		scontrino.id.length = 0;
	}
	scontrino.getResto = function (resto) {
		var res = [];
		var tot = scontrino.getTotale().replace(",", ".");

		if (resto) {
			var a = Number(resto.replace(",", ".")) - tot;
			if (a < 0) { a = 0; }
			res.push(resto);
			res.push(a.toFixed(2).replace(".", ","));
		} else {
			var tagli = [1, 5, 10, 50];
			for (var i = 0; i < tagli.length; i++) {
				var a = Math.ceil(tot / tagli[i]) * tagli[i];
				var b = a - tot;
				if (b != 0 && res.indexOf(a) == -1) { res.push(a); res.push(b); }
			}

			for (var i = 0; i < res.length; i++) {
				res[i] = res[i].toFixed(2).replace(".", ",");
			}
		}

		return res;
	}
	scontrino.Riapri = function () {
		scontrino.id.length = 0;
		for (var i=0; i<scontrino.righe.length; ++i) {
			var riga = scontrino.righe[i];
			scontrino.id.push(scontrino.creaID(riga.rep, riga.desc, riga.prezzo));
		}
	}
	scontrino.isAperto = function () {
		return scontrino.id.length != 0;
	}
	scontrino.indexOf = function (rep, desc, prezzo) {
		prezzo = Number(String(prezzo).replace(",","."));
		var id = scontrino.creaID(rep, desc, prezzo);
		return scontrino.id.indexOf(id);
	}
	scontrino.unisciDuplicato = function (idx) {
		for (var i = 0; i < scontrino.id.length; ++i) {
			if (i != idx && scontrino.id[idx] == scontrino.id[i]) {

				scontrino.righe[i].quant += scontrino.righe[idx].quant;
				scontrino.elimina(idx);
				return i;
			}
		}
		return -1;
	}

	scontrino.invia = function () {
		scontrino.id.length = 0;
	}



/* *****************************************
// MODAL_INPUT: Diverse finestre di input:
- " Menu":
		attivata cliccando su totale senza scontrini aperti, cioe' dopo aver stampato (o annullato) uno scontrino
		permette di fare le letture/chiusure di cassa e le stampe del dgfe
- "Prodotto":
		attivata cliccando su tile-scontrino
		permette di cambiare la quantita' ed il prezzo del prodotto nello scontrino
- "Totale":
		attivata cliccando su subtotale (scontrino aperto)
		permette di cambiare il totale di  Menu, fare fatture e scontrini parlanti e pagamenti con i buoni pasto
- "Resto":
		attivata cliccando su tile-scontrino-resto
		permette di inserire l'importo esatto su cui calcolare il resto; se attivata prima di stampare lo scontrino l'importo verra' scritto sullo scontrino  stesso
*******************************************/
function modalInput(tipo, tile) {
	if (tipo == "Resto") {
		modalInputResto();
	} else if (tipo == "Prodotto") {
		modalInputProdotto(tile, "quantita");
	} else if (tipo == "ProdottoPrezzo") {
		tipo = "Prodotto";
		modalInputProdotto(tile, "prezzo");
	} else if (tipo == " Menu") {
		modalInputMenu();
	} else if (tipo == "Totale") {
		modalInputTotale();
	}

	document.getElementById("modalInput Menu").style.display = "none";
	document.getElementById("modalInputProdotto").style.display = "none";
	document.getElementById("modalInputTotale").style.display = "none";
	document.getElementById("modalInputResto").style.display = "none";

	if (tipo == "") {
		document.getElementById("modalInput").style.display = "none";
		return;
	} else {
		document.getElementById("modalInput" + tipo).style.display = "block";
		document.getElementById("modalInput").style.display = "block";
	}
}

function modalInputMenu () {
	document.getElementById("menu_annulla").onclick = function () {
		animaClick(this);
		modalInput("");
	}
	document.getElementById("menu_chiusuraFiscale").onclick = function () {
		animaClick(this);
		registratore.chiusuraFiscale();
	}
	document.getElementById("menu_letturaGiornaliera").onclick = function () {
		animaClick(this);
		registratore.letturaGiornaliera();
	}
	document.getElementById("menu_aperturaCassetto").onclick = function () {
		animaClick(this);
		registratore.aperturaCassetto();
	}
	document.getElementById("menu_ultimoScontrino").onclick = function () {
		animaClick(this);
		registratore.stampaUltimoScontrino();
	}
	

}

function modalInputTotale () {
	document.getElementById("totale_annulla").onclick = uiEventAnnulla;
	document.getElementById("totale_elimina").onclick = uiEventElimina;
	
	function uiEventAnnulla() {
		animaClick(this);
		helperRiapriScontrino();
		modalInput("");
	}

	function uiEventElimina() {
		animaClick(this);
		var div_scontr = document.getElementById("scontr");
		for (var i = div_scontr.childNodes.length; i > 0; i--) {
			div_scontr.removeChild(div_scontr.firstChild);
		}
		updateTotale();
		modalInput("");
	}
}

function modalInputProdotto (tile, keypad_iniziale) {
	var tiles = document.getElementById("scontr").childNodes;
	for (var idx = 0; idx < tiles.length && tiles[idx] != tile; ++idx) {}
	if (idx == tiles.length) { console.log("Errore in modalInputProdotto"); return; }

	var digits = "";
	var prodotto_visore = "";
	keypadReset(keypad_iniziale);
	if (keypad_iniziale == "prezzo") {
		document.getElementById("prodotto_prezzo").style.setProperty("-webkit-animation-name", "move_down_fast");
		document.getElementById("prodotto_quantita").style.setProperty("-webkit-animation-name", "move_up_fast");
	} else {
		document.getElementById("prodotto_quantita").style.setProperty("-webkit-animation-name", "");
		document.getElementById("prodotto_prezzo").style.setProperty("-webkit-animation-name", "");
	}

	document.getElementById("prodotto_annulla").onclick = uiEventAnnulla;
	document.getElementById("prodotto_elimina").onclick = uiEventElimina;
	document.getElementById("prodotto_ok").onclick = uiEventOK;
	document.getElementById("prodotto_prezzo").onclick = uiEventCambiaPrezzo;
	document.getElementById("prodotto_quantita").onclick = uiEventCambiaQuantita;
	var tasti = document.getElementById("prodotto_keypad").getElementsByTagName("TD");
	for (var i = 0; i < tasti.length; i++) { tasti[i].onclick = uiEventKeypad; }

	document.getElementById("prodotto_digit_prezzo").innerHTML = "&euro; " + scontrino.getPrezzo(idx);
	document.getElementById("prodotto_digit_quantita").innerHTML = scontrino.getQuantita(idx);

	function uiEventAnnulla() {
		animaClick(this);
		modalInput("");
	}

	function uiEventOK() {
		animaClick(this);
		updateTileProdotto(tile, document.getElementById("prodotto_digit_quantita").innerHTML, document.getElementById("prodotto_digit_prezzo").innerHTML);
		modalInput("");
	}

	function uiEventElimina() {
		animaClick(this);
		scontrino.elimina(idx);
		document.getElementById("scontr").removeChild(tile);
		updateTotale();
		modalInput("");
	}

	function uiEventKeypad () {
		var tasto = this.innerHTML;
		if (tasto == "," && digits.indexOf(",") != -1) { return; }

		var tasto = this.innerHTML;
		if (tasto == "C") {
			digits = "";
		} else {
			if (digits.length > 8) { return; }
			digits += tasto;
		}
		animaClick(this);

		if (prodotto_visore == "prezzo") {
			var a = String((digits / 100).toFixed(2));
			document.getElementById("prodotto_digit_prezzo").innerHTML = "&euro; " + a.replace(".", ",");
		} else {
			document.getElementById("prodotto_digit_quantita").innerHTML = digits;
		}
	}

	function keypadReset(tipo) {
		digits = "";
		if (prodotto_visore == tipo) { console.log("Non dovrei essere qui"); }
		prodotto_visore = tipo;
		if (tipo == "prezzo") {
			document.getElementById("prodotto_keypad_special").innerHTML = "00";
			var keypad = document.getElementById("prodotto_keypad");
			keypad.className = keypad.className.replace(" keypad_quantita", "");
		} else {
			document.getElementById("prodotto_keypad_special").innerHTML = ",";
			var keypad = document.getElementById("prodotto_keypad");
			keypad.className = keypad.className.replace(" keypad_quantita", "");
			keypad.className += " keypad_quantita";
		}
	}

	function uiEventCambiaPrezzo() {
		animaClick(this);
		keypadReset("prezzo");
		document.getElementById("prodotto_prezzo").style.setProperty("-webkit-animation-name", "move_down");
		document.getElementById("prodotto_quantita").style.setProperty("-webkit-animation-name", "move_up");
	}

	function uiEventCambiaQuantita() {
		animaClick(this);
		keypadReset("quantita");
		document.getElementById("prodotto_prezzo").style.setProperty("-webkit-animation-name", "move_down_reverse");
		document.getElementById("prodotto_quantita").style.setProperty("-webkit-animation-name", "move_up_reverse");
	}
}


function modalInputResto () {
	var digits = "";
	var prev_modal = "";
	if (document.getElementById("modalInputTotale").style.display == "block") { prev_modal = "Totale"; }
	document.getElementById("resto_annulla").onclick = uiEventAnnulla;
	document.getElementById("resto_ok").onclick = uiEventAnnulla;
	var tasti = document.getElementById("resto_keypad").getElementsByTagName("TD");
	for (var i = 0; i < tasti.length; i++) { tasti[i].onclick = uiEventKeypad; }
	updateResto();

	function uiEventAnnulla() {
		animaClick(this);
		modalInput(prev_modal);
	}

	function uiEventKeypad () {
		animaClick(this);
		var tasto = this.innerHTML;
		if (tasto == "C") {
			digits = "";
		} else {
			if (digits.length > 8) { return; }
			digits += tasto;
		}
		updateResto();
	}
	function updateResto() {
		var a = String((digits / 100).toFixed(2));
		document.getElementById("resto_digitato").innerHTML = "&euro; " + a.replace(".", ",");

		var b = scontrino.getResto(a)[1];
		document.getElementById("resto_calcolato").innerHTML = "&euro; " + b.replace(".", ",");
	}
}


