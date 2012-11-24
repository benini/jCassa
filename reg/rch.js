var registratore = new RCH();

function RCH() {
	var onRisposta = function(message) {
					if (message != "OK") { alert(message); }
	};
	this.setCallback = function(f) { onRisposta = f; }

	this.onCompleted = function(message) {};
	this.onError = function(message) { alert(message); };

	this.getInfo = function(f_callback) {
		var cmd = new cmdQueue("=C1");
		cmd.push("<</?d").send(function (message) {
			console.log(message);
			f_callback.errore = "eventuali errori";
			f_callback.data_ora = "data_ora";
			f_callback.matricola = "R72223442";
			f_callback.firmware = "firmware";
			f_callback();
		});
/*
Lettura Data e Ora corrente:
“ <</?d ”
- Lettura revisione del Firmware:
“ <</?f ”
- Lettura matricola fiscale:
“ <</?m ”
*/
	}

	this.aperturaCassetto = function () {
		new cmdQueue("=C1").push("=C86").send();
		return this;
	};

	this.letturaGiornaliera = function () {
		new cmdQueue("=C2").push("=C10").send();
		return this;
	};

	this.chiusuraFiscale = function () {
		new cmdQueue("=C3").push("=C10").send();

/*
Dopo la chiusura se la data e ora sull'ipad sono diverse di oltre 5 minuti rispetto alla cassa
chiedere all'utente su vuole aggiornare l'orario
Lettura Data e Ora corrente:
“ <</?d ”
- Set Data e Ora:
 “ >>/?d/$GGMMAA/*HHMMSS ”
*/


		return this;
	};

	this.stampaUltimoScontrino = function () {
		new cmdQueue("=C3").push("=C453/$1").send();
		return this;
	};

	this.stampaScontrino = function (scontrino) {
		var rch = new cmdQueue("=C1");
		//TODO: l'accesso diretto a scontrino non e' bello
		for (var i = 0; i < scontrino.righe.length; ++i) {
			var r = "=R" + scontrino.righe[i].rep;
			r += "/$" + scontrino.righe[i].prezzo.toFixed(2).replace(".", "");
			if (scontrino.righe[i].quant > 1) {
				r += "/*" + scontrino.righe[i].quant;
			}
			var desc = scontrino.getDesc(i);
			if (desc.length > 0) {
				r += "/(" + desc.slice(0, 36) + ")";
			}

			rch.push(r);
		}
		rch.push("=T1");
		rch.send();
		return this;
	};


	function cmdQueue (chiave) {
		this.push = function (str) {
			for (var i=0; i < str.length; i++) {
				var c = str.charCodeAt(i);
				if (c < 32 || c > 127) {
					var new_c = "?";
					if (c == 232) new_c = "e";
					else if (c == 224) new_c = "a";
					str = str.substr(0, i) + new_c + str.substr(i+1);
				}
			}

	//		pack_id = (pack_id >= 9) ? 0 : pack_id +1;

			var res = "\u000201";
			res += ("000" + str.length).slice(-3);
			res = res + "N" + str + pack_id;
			res += xor_string(res);
			res += "\u0003";
			sc += res + "\n";
			return this;

			function xor_string (str) {
				var res = 0;
				for (var i=0; i < str.length; i++) {
					res ^= str.charCodeAt(i);
				}
				return ("0" + res.toString(16)).slice(-2).toUpperCase();
			}
		}

		this.send =	function (callback) {
			var f = (callback != null) ? callback : onRisposta;
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function() {
				if (xmlhttp.readyState==4) {
					if (xmlhttp.status==200) {
				alert(sc.split("\n").length);
				alert(xmlhttp.responseText.split("\n").length);
						f(xmlhttp.responseText);
					} else {
						f(xmlhttp.statusText);
					}
				}
			}

/*			var enc_sc = encodeURIComponent(sc);
			if (enc_sc.length < 2000) {
				xmlhttp.open("GET","rch.php?i=192.168.1.29:23&q=" + encodeURIComponent(sc));
				xmlhttp.send();
			} else { */
			xmlhttp.open("POST", "rch.php");
			xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xmlhttp.send("i=192.168.1.29:23&q=" + encodeURIComponent(sc));

			return this;
		}

	// COSTRUTTORE cmdQueue
		var pack_id = "F";
		var sc = "";


//		this.push("<</?s"); // recupera lo stato della cassa (che sia troppo lento?)
//		this.push("=K"); // CL
//		this.push("=k"); // Se c'e' uno scontrino aperto annullalo
		this.push("=K"); // CL
		this.push(chiave); //Entra nella chiave richiesta
	}
}

