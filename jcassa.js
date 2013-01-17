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
	document.getElementById("menu").onclick = function() {
		animaClick(this);
		modalInput("Menu");
	}
	document.getElementById("scontr_resto").onclick = function () { animaClick(this); modalInput("Resto"); };
	document.getElementById("scontr_variaz").onclick = function () { animaClick(this); };

	var reg_pg_c = 0;
	var reg_pg_i = setInterval(function(){
		reg_pg_c += 2;
		document.getElementById("pg_fiscale").style.backgroundSize = reg_pg_c + "%";
	},100);
	registratore.getInfo(function (info) {
		clearInterval(reg_pg_i);
		document.getElementById("pg_fiscale").style.backgroundSize = "100%";
		if (info[0] === "OK") {
			document.getElementById("pg_fiscale_ok").style.display = "inline";
		} else {
			document.getElementById("pg_fiscale_err").style.display = "inline";
		}
		document.getElementById("pg_fiscale_info").innerHTML = info[1];
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
		var dyn_height = window.innerHeight - Math.floor(1.20 * document.getElementById("subtot").offsetHeight);
		var dyn_width = window.innerWidth - Math.floor(1.05 * document.getElementById("subtot").offsetWidth);

		document.getElementById("unknow-width-and-height").style.width = dyn_width + "px";
		document.getElementById("unknow-width-and-height").style.height = dyn_height + "px";
		document.getElementById("unknow-width").style.width = dyn_width + "px";
		document.getElementById("unknow-height").style.height = dyn_height + "px";

		document.getElementById("modalInput").style.width = dyn_width + "px";

		document.getElementById("modalInput").style.height = window.innerHeight + "px";
	}

	function preloadImmagini() {
		var imm = ["img/elimina.png", "img/tot-stampa.gif", "img/pulsante_testo.png"];
		var pg = progress("pg_immagini", imm.length, "pg_immagini_ok");
		var buf = [];
		for (var i = 0; i < imm.length; i++) {
			buf[i] = new Image();
			buf[i].onload = pg;
			buf[i].src = imm[i];
		}
	}

	function loadProdotti() {
		// Chiedere i prodotti con un xml asyncrono?
		var pg = progress("pg_prodotti", reparti.length, "pg_prodotti_ok");
		var buf = [];
		for (var i = 0; i < reparti.length; i++) {
			var divTile = document.createElement("div");
			divTile.className = "metro-tile tile-reparti " + reparti[i].col;
			divTile.innerHTML = reparti[i].reparto;
			divTile.onclick = uiEventCambiaReparto(i);
			document.getElementById('reparti').insertCell(-1).appendChild(divTile);

			/* TODO: Non riesco a prendere l'indirizzo dell'immagine dal css
			buf[i] = new Image();
			buf[i].onload = pg;
			buf[i].src = window.getComputedStyle(divTile).getPropertyValue("background-image");
			*/
			pg();
		}
	}

	function progress (pgbar, length, ok_element) {
		var c = 0;
		return function () {
			document.getElementById(pgbar).style.backgroundSize = 100 * ++c / length + "%";
			if (c == length) document.getElementById(ok_element).style.display = "inline";
		};
	}

}, false);

function progressbar_com (onCompleted) {
	document.getElementById("no_input").style.display = "block";
	var pg_c = 0;
	var pg_i = setInterval(function(){
		pg_c += 2;
		if (pg_c > 19) { // Visualizzo la barra dopo circa 1 secondo
			document.getElementById("pg_comunicazione_box").style.display = "block";
			document.getElementById("pg_comunicazione").style.backgroundSize = pg_c + "%";
		}
	},100);

	return function(risposta) {
		clearInterval(pg_i);
		document.getElementById("no_input").style.display = "none";
		document.getElementById("pg_comunicazione_box").style.display = "none";

		if (onCompleted != null) return onCompleted(risposta);
		if (risposta[0] !== "OK") alert(risposta[1]);
	}
}

//ios6 bug: sembra che lo scroll annulli i timeout (ad esempio se il pulsante viene premuto strisciando)
window.addEventListener('scroll', function () {
//	resetTiles();
	setTimeout(resetTiles, 60);
});

function resetTiles() {
	var t = document.getElementsByClassName("tile_middle");
	for (var i=0; i < t.length; i++) {
		t[i].className = t[i].className.replace(" tile_middle", "");
	}
}

function animaClick(tile) {
	tile.className += " tile_middle";
	setTimeout(resetTiles, 70);

/*	var click = document.getElementById("click_snd");
	try { // Sull'Ipad currentTime a volte non funziona (quando il suono e' gia' finito?)
		click.pause();
		click.currentTime = 0;
	} catch (e) {}

	click.play();
*/
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

	function uiEventAggiungiProdotto(idx_reparto, idx_prezzo) {
		var divScontr = document.getElementById("scontr");
		return function () {
			var prezzo = reparti[idx_reparto].prezzi[idx_prezzo].prezzo;
			var desc = reparti[idx_reparto].prezzi[idx_prezzo].desc;

			if (prezzo.length < 1) {
				var idx = scontrino.push(1 + idx_reparto, 1, "", 0); // Forzo l'aggiunta di una riga anche se ce n'e' un'altra uguale
				var tile = addTile();
				updateTileProdotto(idx, 1, prezzo, desc);
				modalInput("ProdottoPrezzo", tile);
			} else {
				var idx = scontrino.push(1 + idx_reparto, 1, desc, prezzo);
				if (idx >= divScontr.childNodes.length) addTile();
				updateTileProdotto(idx);
			}

			animaClick(this);
		}

		function addTile() {
			var divTile = document.createElement("div");
			divTile.className = "metro-tile tile-scontrino " + reparti[idx_reparto].col;
			divTile.onclick = function() {
				animaClick(this);
				if (scontrino.getStato() !== "APERTO") {
					scontrino.Riapri();
					updateTotale();
				}
				animaSelezionaRigaScontrino(this);
				modalInput("Prodotto", this);
			}
			divScontr.appendChild(divTile);
			return divTile;
		}
	}
}

	function updateTileProdotto(idx, quant, prezzo, desc, variaz) {
		var tile = document.getElementById("scontr").childNodes[idx];
		var res = scontrino.set(idx, quant, prezzo, desc, variaz);
		tile.innerHTML = scontrino.getDesc(idx) + "<br>" + "N. " + scontrino.getQuantita(idx) + "  x  &euro; " + scontrino.getPrezzo(idx);
		var v = scontrino.getVariaz(idx);
		if (v.length > 0) {
			tile.innerHTML += "<br>" + v;
			tile.className += " tile-scontrino-variaz"
		} else {
			tile.className = tile.className.replace(" tile-scontrino-variaz", "");
		}
		animaSelezionaRigaScontrino(tile);
		updateTotale();
		return res;
	}

	var stato_precedente = "";

	function updateTotale() {
		var tot = document.getElementById("subtot");
		var stato = scontrino.getStato();
		if (stato_precedente !== stato) {
			if (stato === "INVIATO") {
				var divScontr = document.getElementById("scontr");
				while (divScontr.hasChildNodes()) { divScontr.removeChild(divScontr.lastChild); }
				tot.onclick = "";
				tot.className = tot.className.replace(" tile-totale-subtotale", " tile-totale-menu");
				tot.className = tot.className.replace(" tile-totale-stampa", " tile-totale-menu");
				document.getElementById("subtot_riga1").innerHTML = "jCassa";
				document.getElementById("subtot_riga2").innerHTML = "v 1.0";
				document.getElementById("menu").style.display = "block";
				var sc_display = (scontrino.getTotale() != 0) ? "block" : "none";
				document.getElementById("scontr_chiusura").style.display = sc_display;
			} else if (stato === "APERTO") {
				tot.className = tot.className.replace(" tile-totale-stampa", " tile-totale-subtotale");
				tot.className = tot.className.replace(" tile-totale-menu", " tile-totale-subtotale");
				document.getElementById("menu").style.display = "none";
				document.getElementById("scontr_chiusura").style.display = "none";
			} else if (stato === "CHIUSO") {
				tot.onclick = uiEventInviaScontrino;
				tot.className = tot.className.replace(" tile-totale-subtotale", " tile-totale-stampa");
				document.getElementById("subtot_riga1").innerHTML = "";
				document.getElementById("subtot_riga2").innerHTML = "STAMPA";
				document.getElementById("scontr_chiusura").style.display = "block";
			}

			stato_precedente = stato;
		}

		if (stato === "APERTO") {
			tot.onclick = uiEventChiudiScontrino; //ModalInputProdotto cambia la funzione su onclick
			document.getElementById("subtot_riga1").innerHTML = "SubTotale";
			document.getElementById("subtot_riga2").innerHTML = "&euro; " + scontrino.getTotaleStr();
			return;
		}
		var intestazione = "ULTIMA VENDITA";
		if (stato === "CHIUSO") {
			intestazione = document.getElementById(scontrino.totali[0].id).innerHTML;
		}
		var divTile = document.getElementById("scontr_totale");
		divTile.innerHTML = "<div style='font-size:18px; margin-bottom: 10px; text-align:center;'>" + intestazione + "</div>";
		divTile.innerHTML += "TOTALE<br> &euro; " + scontrino.getTotaleStr();

		divTile = document.getElementById("scontr_resto");
		divTile.innerHTML = "<div style='font-size:18px; margin-bottom: 10px; text-align:center;'>RESTO</div>";
		var i = 0;
		var resti = scontrino.getResto();
		while (i < resti.length) {
			divTile.innerHTML += "<div style='float:left; width: 44%;'> &euro; " + resti[i++] +
			"</div><div style='float:left; width: 20%;'>==></div> &euro; " + resti[i++] + "<br>";
		}
		divTile.scrollIntoView();

		function uiEventChiudiScontrino () {
			animaClick(this);
			scontrino.chiudi();
			updateTotale();
			animaSelezionaRigaScontrino();
			modalInput("Totale");
		}

		function uiEventInviaScontrino() {
			animaClick(this);
			if (scontrino.totali[0].id[0] === "F") {
				for (var i = 1; i < 5; i++)	scontrino.cliente[i] = "  " + document.getElementById("cliente" +i).value;
			} else if (scontrino.totali[0].id[0] === "P") {
				//alert(JSON.stringify(scontrino.scontrino.totali[0].importorighe));
			} else if (scontrino.totali[0].importo != 0) {
				var tot_sc = scontrino.getTotale();
				if (scontrino.totali[0].importo > tot_sc) {
					return alert("Errore: Importo buoni pasto superiore a totale scontrino");
				}
				if (scontrino.totali[0].importo != tot_sc) {
					scontrino.totali.push({id: "T1", importo: 0});
				} else {
					scontrino.totali[0].importo = 0;
				}
			}

			registratore.stampaScontrino(scontrino, new progressbar_com(function(risposta) {
				if (risposta[0] !== "ERROR") {
					scontrino.invia();
					updateTotale();
					modalInput("");
				}
				if (risposta[0] !== "OK") alert(risposta[1]);
			}));
		}
	}


	var scontrino = {};
	scontrino.righe = [];
	scontrino.totali = [];
	scontrino.cliente = ["Cliente:", "", "", "", ""];

	// Funzioni private
	scontrino.id = [];
	scontrino.creaID = function (rep, desc, prezzo, variaz) {
		return "r" + rep + "d" + desc + "p" + prezzo + variaz;
	}

	// Funzioni pubbliche
	scontrino.push = function (rep, quant, desc, prezzo) {
		if (scontrino.id.length != scontrino.righe.length) scontrino.righe.length = scontrino.id.length;

		quant = Number(String(quant).replace(",","."));
		prezzo = Number(String(prezzo).replace(",","."));
		var id = scontrino.creaID(rep, desc, prezzo, "");

		for (var i = 0; i < scontrino.id.length; i++) {
			if (id === scontrino.id[i]) {
				scontrino.righe[i].quant += quant;
				return i;
			}
		}

		scontrino.righe.push({rep: rep, quant: quant, desc: desc, prezzo: prezzo, variaz: ""});
		return scontrino.id.push(id) -1;
	}

	scontrino.elimina = function (idx) {
		if (idx == null) {
			scontrino.id.length = scontrino.righe.length = 0;
			scontrino.totali.length = 0;
		} else {
			scontrino.id.splice(idx, 1);
			scontrino.righe.splice(idx, 1);
		}
	}

	scontrino.set = function (idx, quant, prezzo, desc, variaz) {
		var riga = {
			desc: scontrino.righe[idx].desc,
			quant: scontrino.righe[idx].quant,
			prezzo: scontrino.righe[idx].prezzo,
			variaz: scontrino.righe[idx].variaz
		};

		if (desc && desc != "") { riga.desc = desc; }
		if (quant && quant != "") { riga.quant = Number(String(quant).replace(",",".")); }
		if (prezzo && prezzo != "") {
			riga.prezzo = Number(String(prezzo).replace(",",".").replace("\u20ac ", "") );
		}
		if (variaz) {
			var v = variaz.replace(",",".").replace("\u20ac ", "");
			if (Number(v.slice(1).replace("%", "")) == 0) v = "";
			riga.variaz = v;
		}

		// Controllo che la riga non sia negativa
		var chk_variaz_number = scontrino.calcolaVariaz(riga.quant, riga.prezzo, riga.variaz);
		if ((riga.quant * riga.prezzo + chk_variaz_number) < 0) {
			return "Errore: importo negativo";
		}

		scontrino.righe[idx].desc = riga.desc;
		scontrino.righe[idx].quant = riga.quant;
		scontrino.righe[idx].prezzo = riga.prezzo;
		scontrino.righe[idx].variaz =riga.variaz;
		scontrino.id[idx] = scontrino.creaID(scontrino.righe[idx].rep, riga.desc, riga.prezzo, riga.variaz);
		return "";
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

	scontrino.getVariaz = function (idx) {
		var res = String(scontrino.righe[idx].variaz);
		if (res.length > 0 && res.indexOf("%") == -1) {
			res = res[0] + " &euro;" + res.slice (1);
		}
		return res.replace(".", ",");
	}

	scontrino.calcolaVariaz = function(quant, prezzo, variaz) {
		variaz = String(variaz).replace(",", ".");
		if (variaz.indexOf("%") == -1) {
			var v = Number(variaz.slice(1));
		} else {
			var perc = Number(variaz.slice(1, -1));
			var imp = quant * prezzo;
			var v = Math.round(imp * perc) / 100;
		}
		if (variaz[0] == "-") v = -v;
		return v;
	}

	scontrino.getVariazNumber = function(idx) {
		return scontrino.calcolaVariaz(
			scontrino.righe[idx].quant,
			scontrino.righe[idx].prezzo,
			scontrino.righe[idx].variaz
		);
	}

	scontrino.getTotale = function () {
		var scontrino_totale = 0;
		for (var i=0; i < scontrino.righe.length; ++i) {
			scontrino_totale += scontrino.righe[i].quant * scontrino.righe[i].prezzo + scontrino.getVariazNumber(i);
		}
		return scontrino_totale;
	}
	scontrino.getTotaleStr = function () {
		return scontrino.getTotale().toFixed(2).replace(".", ",");
	}

	scontrino.importo_resto = 0;

	scontrino.getResto = function (resto) {
		var res = [];
		var tot = scontrino.getTotale();

		if (resto != null) {
			resto = String(resto);
			var a = Number(resto.replace(",", ".")) - tot;
			if (a < 0) { a = 0; }
			res.push(resto);
			res.push(a.toFixed(2).replace(".", ","));
		} else {
			var tagli = [1, 5, 10, 50];
			if (scontrino.importo_resto > tot) tagli = [scontrino.importo_resto];

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
	scontrino.chiudi = function () {
		scontrino.importo_resto = 0;
		scontrino.totali.push({id: "T1", importo: 0});
	}
	scontrino.invia = function () {
		scontrino.id.length = 0;
		scontrino.totali.length = 0;
	}
	scontrino.Riapri = function () {
		scontrino.totali.length = 0;
		scontrino.id.length = 0;
		for (var i=0; i<scontrino.righe.length; ++i) {
			var riga = scontrino.righe[i];
			scontrino.id.push(scontrino.creaID(riga.rep, riga.desc, riga.prezzo));
		}
	}
	scontrino.getStato = function () {
		if (scontrino.id.length > 0) {
			if (scontrino.totali.length == 0) return "APERTO";
			return "CHIUSO";
		}
		return "INVIATO";
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
	} else if (tipo == "Menu") {
		modalInputMenu();
	} else if (tipo == "Totale") {
		modalInputTotale();
	}

	document.getElementById("modalInputMenu").style.display = "none";
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

	return;


function modalInputMenu () {
	document.getElementById("menu_annulla").onclick = function () {
		animaClick(this);
		modalInput("");
	}
	document.getElementById("menu_chiusuraFiscale").onclick = function () {
		animaClick(this);
		registratore.chiusuraFiscale(new progressbar_com());
	}
	document.getElementById("menu_letturaGiornaliera").onclick = function () {
		animaClick(this);
		registratore.letturaGiornaliera(new progressbar_com());
	}
	document.getElementById("menu_aperturaCassetto").onclick = function () {
		animaClick(this);
		registratore.aperturaCassetto(new progressbar_com());
	}
	document.getElementById("menu_ultimoScontrino").onclick = function () {
		animaClick(this);
		registratore.stampaUltimoScontrino(new progressbar_com());
	}
}

function modalInputTotale () {
	var digits = "";
	document.getElementById("dati_cliente").style.display = "none";
	document.getElementById("bpasto").style.display = "none";
	for (var i=1; i < 5; i++) document.getElementById("cliente" + i).value = "";

	var totali = document.getElementsByClassName("pulsante_totale");
	for (var i=0; i < totali.length; i++) {
		totali[i].className = totali[i].className.replace(" pulsante_selected", "");
		totali[i].onclick = uiEventTotale;
	}
	totali[0].className += " pulsante_selected";
	scontrino.totali[0].id = totali[0].id;

	document.getElementById("totale_annulla").onclick = uiEventAnnulla;
	document.getElementById("totale_elimina").onclick = uiEventElimina;
	var tasti = document.getElementById("bpasto_keypad").getElementsByTagName("TD");
	for (var i = 0; i < tasti.length; i++) { tasti[i].onclick = uiEventKeypad; }


	function uiEventKeypad () {
		animaClick(this);
		var tasto = this.innerHTML;
		if (tasto == "C") {
			digits = "";
		} else {
			if (digits.length > 8) { return; }
			digits += tasto;
		}
		scontrino.totali[0].importo = digits / 100;
		updateVisore();
	}
	function updateVisore() {
		document.getElementById("bpasto_digitato").innerHTML = "&euro; " +
			scontrino.totali[0].importo.toFixed(2).replace(".", ",");
	}

	function uiEventTotale() {
		document.getElementById("dati_cliente").style.display = "none";
		document.getElementById("bpasto").style.display = "none";
		var totali = document.getElementsByClassName("pulsante_selected");
		totali[0].className = totali[0].className.replace(" pulsante_selected", "");
		this.className += " pulsante_selected";
		scontrino.totali[0].id = this.id;
		scontrino.totali[0].importo = 0;
		updateTotale();

		if (this.id[0] === "F") {
			document.getElementById("dati_cliente").style.display = "block";
			var inputs = document.getElementById("dati_cliente").getElementsByTagName("input");
			for (var i = 0; i < inputs.length; i++) inputs[i].onkeydown = function(e) {
			    if (e && e.keyCode == 13) {//Enter
					var idx = Number(this.id.slice(7));
					if (idx++ == 4) this.blur();
					else document.getElementById("cliente" + idx).focus();
				}
			}
			inputs[0].focus();
		} else if (this.innerHTML === "BUONI PASTO") {
			scontrino.totali[0].importo = scontrino.getTotale();
			updateVisore();
			document.getElementById("bpasto").style.display = "block";
		}
	}
	
	function uiEventAnnulla() {
		animaClick(this);
		scontrino.Riapri();
		updateTotale();
		modalInput("");
	}

	function uiEventElimina() {
		animaClick(this);
		scontrino.elimina();
		updateTotale();
		modalInput("");
	}
}

function modalInputProdotto (tile, keypad_iniziale) {
	var tiles = document.getElementById("scontr").childNodes;
	for (var idx = 0; idx < tiles.length && tiles[idx] != tile; ++idx) {}
	if (idx == tiles.length) { console.log("Errore in modalInputProdotto"); return; }

	var digits = "";
	var variaz_tipo = ""
	document.getElementById("prodotto_digit_variaz").innerHTML = scontrino.getVariaz(idx);
	document.getElementById("prodotto_digit_prezzo").innerHTML = "&euro; " + scontrino.getPrezzo(idx);
	document.getElementById("prodotto_digit_quantita").innerHTML = scontrino.getQuantita(idx);

	var elem = ["prodotto_variaz", "prodotto_prezzo", "prodotto_quantita"];
	keypadReset("prodotto_" + keypad_iniziale);
	for (var i =0; i < elem.length; i++) {
		document.getElementById(elem[i]).style.setProperty("-webkit-animation-name", "pos" + i);
	}

	document.getElementById("prodotto_annulla").onclick = uiEventAnnulla;
	document.getElementById("prodotto_elimina").onclick = uiEventElimina;
	document.getElementById("prodotto_ok").onclick = uiEventOK;
	document.getElementById("subtot").onclick = uiEventOK;
	document.getElementById("prodotto_variaz").onclick = uiEventCambiaKeypad;
	document.getElementById("prodotto_prezzo").onclick = uiEventCambiaKeypad;
	document.getElementById("prodotto_quantita").onclick = uiEventCambiaKeypad;
	var tasti = document.getElementById("prodotto_keypad").getElementsByTagName("TD");
	for (var i = 0; i < tasti.length; i++) { tasti[i].onclick = uiEventKeypad; }
	var tasti_variaz = document.getElementsByClassName("keypad_tasti_variaz");
	for (var i = 0; i < tasti_variaz.length; i++) tasti_variaz[i].onclick = uiEventVariazTipo;


	function uiEventAnnulla() {
		animaClick(this);
		updateTotale();
		modalInput("");
	}

	function uiEventOK() {
		animaClick(this);
		var res = updateTileProdotto(idx,
			document.getElementById("prodotto_digit_quantita").innerHTML,
			document.getElementById("prodotto_digit_prezzo").innerHTML, "",
			document.getElementById("prodotto_digit_variaz").innerHTML);
		if (res.length > 0) alert(res);
		else modalInput("");
	}

	function uiEventElimina() {
		animaClick(this);
		scontrino.elimina(idx);
		document.getElementById("scontr").removeChild(tile);
		updateTotale();
		modalInput("");
	}

	function uiEventCambiaKeypad() {
		keypadReset(this.id);
	}

	function uiEventVariazTipo () {
		variaz_tipo = this.innerHTML;
		animaClick(this);
		keypadReset("prodotto_variaz");
		updateVisore();
	}

	function uiEventKeypad () {
		var tasto = this.innerHTML;
		if (tasto == "," && digits.indexOf(",") != -1) return;
		if (tasto == "C") {
			digits = "";
		} else {
			if (digits.length >= 8) return;
			digits += tasto;
		}
		animaClick(this);
		updateVisore();
	}

	function updateVisore() {
		var prodotto_visore = elem[2].slice(9);
		if (prodotto_visore == "prezzo") {
			var a = String((digits / 100).toFixed(2));
			document.getElementById("prodotto_digit_prezzo").innerHTML = "&euro; " + a.replace(".", ",");
		} else if (prodotto_visore == "variaz") {
			if (variaz_tipo.indexOf("%") != -1) {
				var d = (digits.length > 0) ? digits : 0;
				var s = variaz_tipo[0] + " " + d + "%";
			} else {
				var s =  variaz_tipo[0] + " &euro; " + String((digits / 100).toFixed(2)).replace(".", ",");
			}
			document.getElementById("prodotto_digit_variaz").innerHTML = s;
		} else {
			document.getElementById("prodotto_digit_quantita").innerHTML = digits;
		}
	}

	function keypadReset(tipo) {
		var idx = elem.indexOf(tipo);
		if (idx == 0 || idx == 1) {
			elem[2] = elem.splice(idx, 1, elem[2])[0];
			document.getElementById(tipo).style.setProperty("-webkit-animation-name", "from" + idx);
			document.getElementById(elem[idx]).style.setProperty("-webkit-animation-name", "to" + idx);
		}

		digits = "";
		var prodotto_visore = elem[2].slice(9);

		var a = document.getElementsByClassName(" keypad_tasti_variaz_sel");
		for (var i=0; i < a.length; i++) {
			a[i].className = a[i].className.replace(" keypad_tasti_variaz_sel", "");
		}

		if (prodotto_visore === "prezzo") {
			document.getElementById("prodotto_keypad_special").innerHTML = "00";
		} else if (prodotto_visore === "variaz") {
			if (variaz_tipo == "") variaz_tipo = "-%";
			var a = document.getElementsByClassName(" keypad_tasti_variaz");
			for (var i=0; i < a.length; i++) {
				if (a[i].innerHTML === variaz_tipo) a[i].className += " keypad_tasti_variaz_sel";
			}
			if (variaz_tipo.indexOf("%") != -1) {
				document.getElementById("prodotto_keypad_special").innerHTML = ",";
			} else {
				document.getElementById("prodotto_keypad_special").innerHTML = "00";
			}
		} else {
			document.getElementById("prodotto_keypad_special").innerHTML = ",";	
		}

		var keypad = document.getElementById("prodotto_keypad");
		keypad.className = keypad.className.replace(" keypad_variaz", "");
		keypad.className = keypad.className.replace(" keypad_quantita", "");
		keypad.className += " keypad_" + prodotto_visore;
	}
}


function modalInputResto () {
	var digits = "";
	var prev_modal = "";
	if (document.getElementById("modalInputTotale").style.display == "block") { prev_modal = "Totale"; }
	document.getElementById("resto_annulla").onclick = uiEventAnnulla;
	document.getElementById("resto_ok").onclick = uiEventOK;
	var tasti = document.getElementById("resto_keypad").getElementsByTagName("TD");
	for (var i = 0; i < tasti.length; i++) { tasti[i].onclick = uiEventKeypad; }
	updateResto();

	function uiEventAnnulla() {
		animaClick(this);
		chiudi();
	}

	function uiEventOK() {
		animaClick(this);
		scontrino.importo_resto = digits / 100;
		updateTotale();
		registratore.visualizzaResto(
			document.getElementById("resto_digitato").innerHTML,
			document.getElementById("resto_calcolato").innerHTML);
		chiudi();
	}

	function chiudi() {
		if (prev_modal != "") {
			document.getElementById("modalInputResto").style.display = "none";
			document.getElementById("modalInputTotale").style.display = "block";
		} else {
			modalInput(prev_modal);
		}
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
		var a = digits / 100;
		document.getElementById("resto_digitato").innerHTML = "&euro; " + a.toFixed(2).replace(".", ",");
		document.getElementById("resto_calcolato").innerHTML = "&euro; " + scontrino.getResto(a)[1];
	}
}

}
