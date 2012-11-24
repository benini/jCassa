var registratore = new RCH();

function RCH() {
	var onRisposta = function(message) {
					if (message != "OK") { alert(message); }
	};
	this.setCallback = function(f) { onRisposta = f; }

	this.onCompleted = function(message) {};
	this.onError = function(message) { alert(message); };

	this.getInfo = function(f_callback) {
		var cmd = new cmdQueue().push("=C1");
		cmd.push("<</?d").push("<</?f").push("<</?m").send(function (risposte) {
			var res = {};
			res.data_ora = risposte[1];
			res.firmware = risposte[2];
			res.matricola = risposte[3];
			f_callback(res);
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
		new cmdQueue().push("=C1").push("=C86").send();
		return this;
	};

	this.letturaGiornaliera = function () {
		new cmdQueue().push("=C2").push("=C10").send();
		return this;
	};

	this.chiusuraFiscale = function () {
		new cmdQueue().push("=C3").push("=C10").send();

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
		new cmdQueue().push("=C3").push("=C453/$1").send();
		return this;
	};

	this.stampaScontrino = function (scontrino, onCompleted) {
		var rch = new cmdQueue().push("=C1");
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
		rch.send(function (risposte) {
			var res = [];
			res.push(risposte[risposte.length -1]);
			res.push(risposte[risposte.length -2]);
			onCompleted(res);
		});
		return this;
	};


	function cmdQueue() {
		var pack_id = 0;
		var sc = "";

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

			pack_id = (pack_id >= 9) ? 0 : pack_id +1;

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
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function() {
				if (xmlhttp.readyState==4) {
					if (xmlhttp.status==200) {
						var res = [];
						var risposte = xmlhttp.responseText.split("\n");
						for (var i=0; i < risposte.length; i++) {
							var buf = traduci(risposte[i]);
							if (buf.length > 0) res.push(buf);
						}
						callback(res);
					} else {
						callback(xmlhttp.statusText);
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

		function traduci (msg) {
			if (msg.charCodeAt(0) > 20) return msg;
			return msg.substr(8, msg.length -12);
		}
	}
}

