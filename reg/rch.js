var registratore = new RCH();

function RCH() {
	this.getInfo = function(f_callback) {
		var cmd = new cmdQueue().push("=C1");
		cmd.push("<</?d").push("<</?f").push("<</?m").send(function (risposte) {
			var res = [risposte[0]];
			if (risposte[0] === "OK") {
				res.push(risposte[2].substr(1) 
						+ " --- S/N " + risposte[4].substr(1)
						+ " - " + risposte[3].substr(1));
			} else {
				res.push("Errore!");
			}
			f_callback(res);
		});
	}

	this.aperturaCassetto = function (callback) {
		new cmdQueue().push("=C1").push("=C86").send(function (msg) {
			msg.splice(1, msg.length -2);
			callback(msg);
		});
		return this;
	};

	this.letturaGiornaliera = function (callback) {
		new cmdQueue().push("=C2").push("=C10").send(function (msg) {
			msg.splice(1, msg.length -2);
			callback(msg);
		});
		return this;
	};

	this.chiusuraFiscale = function (callback) {
		new cmdQueue().push("=C3").push("=C10").send(function (msg) {
			msg.splice(1, msg.length -2);
			callback(msg);
		});
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

	this.stampaUltimoScontrino = function (callback) {
//		new cmdQueue().push("=C3").push("=C453/$1").send(function (msg) {
		new cmdQueue().push("=C4").push(">>/?H/$1/(OFFICE LINE SNC)")
		.push(">>/?H/$2/(Viale delle Ceramiche 22B)")
		.push(">>/?H/$3/(48018 FAENZA (RA))")
		.push(">>/?H/$4/(Tel. 0546 28348)")
		.push(">>/?H/$5/(www.officelinefaenza.it)")
		.send(function (msg) {
			msg.splice(1, msg.length -2);
			callback(msg);
		});

		return this;
	};

	this.stampaScontrino = function (scontrino, onCompleted) {
		var cmd = new cmdQueue().push("=C1");
		//TODO: l'accesso diretto a scontrino non e' bello
		if (scontrino.totale_cassa[0] === "F") {
			for (var i = 1; i < 6; ++i) {
				cmd.push("=A/$" + i + "/(" + scontrino.cliente[i -1].slice(0, 36) + ")");
			}
			cmd.push("=F/*4");
		} else if (scontrino.totale_cassa[0] === "P") {
			cmd.push("=F/*0");
		}

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

			cmd.push(r);
		}
		cmd.push("=T" + scontrino.totale_cassa.substr(1));
		cmd.send(function (risposte) {
			var res = [risposte[0]];

			if (risposte[0] === "ERROR" && risposte.length -1 == cmd.length) {
				//Problema fine carta: 
				//quando finisce la carta la printf memorizza tutti i comandi e poi li stampa automaticamente
				res[0] = "WARNING";
			}

			var messaggio = "";
			for (var i = 1; i < risposte.length; i++) {
				if (risposte[i][0] !== "O") messaggio += risposte[i] + "\n";
			}
			res.push(messaggio.substr(0, messaggio.length -1));
			onCompleted(res);
		});
		return this;
	};


	function cmdQueue() {
		var pack_id = 0;
		var sc = "";

		this.length = 0;

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

			pack_id = (pack_id >= 9) ? 1 : pack_id +1;

			var res = "\u000201";
			res += ("000" + str.length).slice(-3);
			res = res + "N" + str + pack_id;
			res += xor_string(res);
			res += "\u0003";
			sc += res + "\n";
			this.length++;
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
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function() {
				if (xmlhttp.readyState==4) {
					var res = [];
					if (xmlhttp.status==200) {
						var risposte = xmlhttp.responseText.split("\n");

						for (var i=0; i < risposte.length -1; i++) {
							var buf = traduci(risposte[i]);
							if (buf.length > 0) res.push(buf);
						}

						if (res.length == 0) {
							res.push("ERROR");
							res.push("Risposta imprevista dalla stampante fiscale: contattare il centro di assistenza");
						} else {
							res.splice(0, 0, risposte[risposte.length -1]);
						}
					} else {
						if (xmlhttp.status == 0) {
							res.push("ERROR");
							res.push("Errore nella connessione con l'Access Point.\n"
									+ "Verificare la connessione WiFi.\n");
						} else {
							res.push("ERROR");
							res.push("L'Access Point ha risposto in maniera imprevista: " + xmlhttp.statusText +".\n"
									+ "Contattare il centro di assistenza.");
						}
					}

					callback(res);
				}
			}

/*			var enc_sc = encodeURIComponent(sc);
			if (enc_sc.length < 2000) {
				xmlhttp.open("GET","rch.php?i=192.168.1.29:23&q=" + encodeURIComponent(sc));
				xmlhttp.send();
			} else { */
			xmlhttp.open("POST", "reg/rch.php");
			xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded;charset=ISO-8859-1");
			xmlhttp.send("i=192.168.1.29:23&q=" + encodeURIComponent(sc));

			return this;
		}

		var errori = ["Problema stampante fiscale ", "EP0000", "Fine Carta"];

		function traduci (msg) {
			if (msg.charCodeAt(0) > 20) return msg;
			var res = msg.substr(8, msg.length -12);
			if (res[0] === "E") {
				var codice_errore = res.substr(0, 6);
				var f = errori.indexOf(codice_errore);
				res = "Errore: " + errori [f+1] + " (" + codice_errore + ")";
			}
			return res;
		}
	}
}

