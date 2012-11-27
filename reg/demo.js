var registratore = new DEMO();

function DEMO() {
	this.getInfo = function(f_callback) {
		var res = ["WARNING", "Versione Demo!"];
		f_callback(res);
	};

	this.aperturaCassetto = this.letturaGiornaliera = this.chiusuraFiscale = this.stampaUltimoScontrino = this.getInfo;

	this.stampaScontrino = function (scontrino, onCompleted) {
		var res = ["WARNING", "Versione Demo!"];
		onCompleted(res);
	};
}

