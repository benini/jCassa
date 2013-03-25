window.addEventListener('load', function() {
	new FastClick(document.body); // Caricamento FastClick per iPad
	dyn_dimensions();
	window.onresize=function() { dyn_dimensions(); }

	//TODO: Verificare aggiornamenti ed applicarli
	document.getElementById("pg_aggiornamenti").style.backgroundSize = "100%";
	document.getElementById("pg_aggiornamenti_ok").style.display = "inline";

	preloadImmagini();
	loadProdotti();
	updateTotale("INVIATO");
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
			if (stato_precedente === "INVIATO") scontrino.reset();
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
				updateTotale("APERTO");
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
		updateTotale("APERTO");
		return res;
	}

	var stato_precedente = "";

	function updateTotale(stato) {
		var tot = document.getElementById("subtot");
		if (typeof stato === "undefined") stato = stato_precedente;
		if (stato_precedente !== stato) {
			if (stato === "INVIATO") {
				var divScontr = document.getElementById("scontr");
				while (divScontr.hasChildNodes()) { divScontr.removeChild(divScontr.lastChild); }
				tot.onclick = "";
				tot.className = tot.className.replace(" tile-totale-subtotale", " tile-totale-menu");
				tot.className = tot.className.replace(" tile-totale-stampa", " tile-totale-menu");
				document.getElementById("subtot_riga1").innerHTML = "";
				document.getElementById("subtot_riga2").innerHTML = "";
				document.getElementById("menu").style.display = "block";
				document.getElementById("scontr_variaz").style.display = "none";
			} else if (stato === "APERTO") {
				tot.className = tot.className.replace(" tile-totale-stampa", " tile-totale-subtotale");
				tot.className = tot.className.replace(" tile-totale-menu", " tile-totale-subtotale");
				document.getElementById("menu").style.display = "none";
				document.getElementById("subtot_riga1").innerHTML = "SubTotale";
				document.getElementById("scontr_chiusura").style.display = "none";
			} else if (stato === "CHIUSO") {
				tot.onclick = uiEventInviaScontrino;
				tot.className = tot.className.replace(" tile-totale-subtotale", " tile-totale-stampa");
				document.getElementById("subtot_riga1").innerHTML = "";
				document.getElementById("subtot_riga2").innerHTML = "STAMPA";
				document.getElementById("scontr_chiusura").style.display = "block";
				document.getElementById("scontr_variaz").style.display = "block";
			}

			stato_precedente = stato;
		}

		if (stato === "APERTO") {
			tot.onclick = uiEventChiudiScontrino; //ModalInputProdotto cambia la funzione su onclick
			document.getElementById("subtot_riga2").innerHTML = "&euro; " + scontrino.getTotale().toFixed(2).replace(".", ",");
		} else {
			var elem = document.getElementById("scontr_totale");
			if (stato === "CHIUSO") {
				elem.innerHTML = "<div style='text-align:center;'>" + "TOTALE" + "</div>";
			} else if (stato === "INVIATO") {
				elem.innerHTML = "<div style='font-size:18px; margin-bottom: 10px; text-align:center;'>" + "ULTIMA VENDITA" + "</div>";
				elem.innerHTML += "TOTALE<br>";
				document.getElementById("scontr_chiusura").style.display = (scontrino.getTotale() != 0) ? "block" : "none";
			}

			var totali = scontrino.getTotaliArray();
			elem.innerHTML += "&euro; " + totali[0].importo.toFixed(2).replace(".", ",");
			for (var i = 1; totali.length > 2 && i < totali.length; i++) {
				elem.innerHTML += "<div style='font-size:16px; margin-top: 10px; text-align:right;'>"
					+ document.getElementById(totali[i].id).innerHTML
					+ "<br>&euro; " + totali[i].importo.toFixed(2).replace(".", ",") + "</div>";
			}

			var divTile = document.getElementById("scontr_resto");
			divTile.innerHTML = "<div style='font-size:18px; margin-bottom: 10px; text-align:center;'>RESTO</div>";

			var resti = scontrino.getResto();
			if (resti.length == 0) {
				divTile.innerHTML += "<div style='float:left; width: 44%;'></div>" +
				"<div style='float:left; width: 20%;'></div> &euro; 0,00";
			}
			for (var i = 0; i < resti.length;) {
				divTile.innerHTML += "<div style='float:left; width: 44%;'> &euro; " + resti[i++] +
				"</div><div style='float:left; width: 20%;'>==></div> &euro; " + resti[i++] + "<br>";
			}
			divTile.scrollIntoView();
		}

		function uiEventChiudiScontrino () {
			animaClick(this);
			updateTotale("CHIUSO");
			animaSelezionaRigaScontrino();
			modalInput("Totale");
		}

		function uiEventInviaScontrino() {
			animaClick(this);
			var totali = scontrino.getTotaliArray();
			if (totali[totali.length -1].importo < 0) {
				return alert("Errore: Importo buoni pasto superiore a totale scontrino");
			}
			var tipo_totale = totali[1].id[0];
			if (tipo_totale === "F") {
				for (var i = 1; i < 5; i++)	scontrino.cliente[i] = "  " + document.getElementById("cliente" +i).value;
			} else if (tipo_totale === "P") {
				//alert(JSON.stringify(scontrino.scontrino.totali[0].importorighe));
			}

			registratore.stampaScontrino(scontrino, new progressbar_com(function(risposta) {
				if (risposta[0] !== "ERROR") {
					updateTotale("INVIATO");
					modalInput("");
				}
				if (risposta[0] !== "OK") alert(risposta[1]);
			}));
		}
	}


	var scontrino = new Scontrino();

function Scontrino() {
	this.righe = [];
	this.totali = [];
	this.cliente = [];

	this.reset = function () { init.call(this);}

	this.push = function (rep, quant, desc, prezzo) {
		quant = Number(String(quant).replace(",","."));
		prezzo = Number(String(prezzo).replace(",","."));
		var id = creaID(rep, desc, prezzo, "");

		for (var i = 0; i < index_.length; i++) {
			if (id === index_[i]) {
				this.righe[i].quant += quant;
				return i;
			}
		}

		this.righe.push({rep: rep, quant: quant, desc: desc, prezzo: prezzo, variaz: ""});
		return index_.push(id) -1;
	}

	this.elimina = function (idx) {
		index_.splice(idx, 1);
		this.righe.splice(idx, 1);
		return index_.length;
	}

	this.set = function (idx, quant, prezzo, desc, variaz) {
		var riga = {
			desc: this.righe[idx].desc,
			quant: this.righe[idx].quant,
			prezzo: this.righe[idx].prezzo,
			variaz: this.righe[idx].variaz
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
		var chk_variaz_number = calcolaVariaz(riga.quant * riga.prezzo, riga.variaz);
		if ((riga.quant * riga.prezzo + chk_variaz_number) < 0) {
			return "Errore: importo negativo";
		}

		this.righe[idx].desc = riga.desc;
		this.righe[idx].quant = riga.quant;
		this.righe[idx].prezzo = riga.prezzo;
		this.righe[idx].variaz =riga.variaz;
		index_[idx] = creaID(this.righe[idx].rep, riga.desc, riga.prezzo, riga.variaz);
		return "";
	}

	this.getPrezzo = function (idx) {
		return this.righe[idx].prezzo.toFixed(2).replace(".", ",");
	}

	this.getQuantita = function (idx) {
		return String(this.righe[idx].quant).replace(".", ",");
	}

	this.getDesc = function (idx) {
		return this.righe[idx].desc;
	}

	this.getVariaz = function (idx) {
		var res = String(this.righe[idx].variaz);
		if (res.length > 0 && res.indexOf("%") == -1) {
			res = res[0] + " &euro;" + res.slice (1);
		}
		return res.replace(".", ",");
	}

	this.getVariazNumber = function(idx) {
		return calcolaVariaz(this.righe[idx].quant * this.righe[idx].prezzo, this.righe[idx].variaz);
	}

	this.getTotale = function () {
		var scontrino_totale = 0;
		for (var i=0; i < this.righe.length; ++i) {
			scontrino_totale += this.righe[i].quant * this.righe[i].prezzo + this.getVariazNumber(i);
		}
		return scontrino_totale;
	}

	this.getTotaliArray = function () {
		var res = [{id: "", importo: this.getTotale()}];
		var tot_parz = 0;
		for (var i = 0; i < this.totali.length; i++) {
			tot_parz += this.totali[i].importo;
			res.push({id: this.totali[i].id, importo: this.totali[i].importo});
		}
		if (res[res.length -1].importo != 0) res.push({id: "T1", importo: 0});
		res[res.length -1].importo = this.getTotale() - tot_parz;
		return res;
	}

	this.setResto = function (resto) {
		if (resto != 0) resto_ = [resto];
	}

	this.getResto = function () { // Ritorniamo il resto sull'ultimo totale
		var res = [];
		var tot = this.getTotale();
		for (var i = 0; i < this.totali.length; i++) { tot -= this.totali[i].importo; }
		//var totali = this.getTotaliArray();
		//var tot = totali[totali.length -1].importo;
		if (tot < 0) return res;

		if (resto_.length == 1) {
			var b = resto_[0] - tot;
			if (b < 0) b= 0;
			res.push(resto_[0]);
			res.push(b);
		} else {
			for (var i = 0; i < resto_.length; i++) {
				var a = Math.ceil(tot / resto_[i]) * resto_[i];
				var b = a - tot;
				if (b != 0 && res.indexOf(a) == -1) { res.push(a); res.push(b); }
			}
		}

		for (var i = 0; i < res.length; i++) {
			res[i] = res[i].toFixed(2).replace(".", ",");
		}
		return res;
	}

	//Private:
	var resto_ = [];
	var index_ = [];

	return init.call(this);

	function init () {
		resto_ = [1, 5, 10, 50];
		index_ = [];
		this.righe = [];
		this.totali = [{id: "T1", importo: 0}];
		this.cliente = ["Cliente:", "", "", "", ""];
	}

	function creaID (rep, desc, prezzo, variaz) {
		return "r" + rep + "d" + desc + "p" + prezzo + variaz;
	}

	function calcolaVariaz (importo, variaz) {
		variaz = String(variaz).replace(",", ".");
		if (variaz.indexOf("%") == -1) {
			var v = Number(variaz.slice(1));
		} else {
			var perc = Number(variaz.slice(1, -1));
			var v = Math.round(importo * perc) / 100;
		}
		if (variaz[0] == "-") v = -v;
		return v;
	}
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
		updateTotale("CHIUSO");
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
		digits = "";

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
		updateTotale("CHIUSO");
	}
	
	function uiEventAnnulla() {
		animaClick(this);
		updateTotale("APERTO");
		modalInput("");
	}

	function uiEventElimina() {
		animaClick(this);
		scontrino.reset();
		updateTotale("INVIATO");
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
		updateTotale("APERTO");
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
		document.getElementById("scontr").removeChild(tile);
		if (scontrino.elimina(idx) != 0) {
			updateTotale("APERTO");
		} else {
			scontrino.reset();
			updateTotale("INVIATO");
		}
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
		scontrino.setResto(digits / 100);
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
		var totali = scontrino.getTotaliArray();
		var tot = totali[totali.length -1].importo;
		var r = (tot < 0) ? 0 : a - tot;
		var resto = (r < 0) ? "0,00" : r.toFixed(2).replace(".", ",");
		document.getElementById("resto_digitato").innerHTML = "&euro; " + a.toFixed(2).replace(".", ",");
		document.getElementById("resto_calcolato").innerHTML = "&euro; " + resto;
	}
}

}
