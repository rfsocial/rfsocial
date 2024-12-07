class Report {
    constructor(
        id,
        szoveg,
        statusz,
        felhasznalo_id,
        bejegyzes_id,
        hozzaszolas_id,
        felhasznaloKepUrl
    ) {
        this.id = id;
        this.szoveg = szoveg;
        this.statusz = statusz;
        this.felhasznalo_id = felhasznalo_id;
        this.bejegyzes_id = bejegyzes_id;
        this.hozzaszolas_id = hozzaszolas_id;
        this.felhasznaloKepUrl = felhasznaloKepUrl;
    }
}

module.exports = Report;