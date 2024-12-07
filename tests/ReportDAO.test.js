const { database } = require('../src/app/config/db');
const ReportDAO = require('../src/app/dao/ReportDAO');

// jest.mock('../src/app/config/db'); // Mockoljuk az adatbázis modult
jest.mock('../src/app/config/db', () => ({
    database: {
        query: jest.fn() // Kifejezetten mockoljuk a `query` metódust
    }
}));
jest.mock('../src/app/dao/UserDAO'); // Mockoljuk a FelhasznaloDAO-t
describe('ReportDAO tests', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Minden teszt után töröljük a mockokat
    });

    describe('create()', () => {
        it('should create a new report and return it', async () => {
            const mockReportData = {
                id: 1,
                felhasznalo_id: 123,
                szoveg: 'This is a report',
                statusz: false,
                bejegyzes_id: 1,
                hozzaszolas_id: null
            };

            database.query.mockResolvedValueOnce({
                rows: [mockReportData]
            });

            const result = await ReportDAO.create(
                mockReportData.felhasznalo_id,
                mockReportData.szoveg,
                'post',
                mockReportData.bejegyzes_id
            );

            expect(database.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO Bejelentes'),
                [mockReportData.felhasznalo_id, mockReportData.szoveg, mockReportData.bejegyzes_id, null]
            );

            expect(result).toEqual(expect.objectContaining({
                id: 1,
                szoveg: 'This is a report',
                statusz: false,
                felhasznalo_id: 123,
                bejegyzes_id: 1,
                hozzaszolas_id: null
            }));
        });

        it('should throw an error if the database query fails', async () => {
            database.query.mockRejectedValueOnce(new Error('Database error'));

            await expect(ReportDAO.create(123, 'Test report', 'post', 1)).rejects.toThrow('Database error');
        });
    });

    describe('updateReportState()', () => {
        it('should update the report state and return the updated report', async () => {
			// Mockolt adatbázis-válasz
			const mockResult = {
				rowCount: 1,
				rows: [
					{
						id: 1,
						szoveg: "Fenyegető szotyiscigány aurája van",
						statusz: true,
						felhasznalo_id: 30,
						bejegyzes_id: 7,
						hozzaszolas_id: null,
						felhasznaloKepUrl: "https://steamuserimages-a.akamaihd.net/ugc/1805358679144057504/35CE9B7B0A8CA97EAECD28D915CD42F9AA73C7C7/"
					}
				],
			};
	
			// Mockolja a `database.query` metódust
			database.query.mockResolvedValue(mockResult);
	
			// Meghívja a tesztelendő metódust
			const updatedReport = await ReportDAO.updateReportState(1, true);
	
			// Ellenőrzi, hogy a helyes SQL-lekérdezést hívta meg
			expect(database.query).toHaveBeenCalledWith(
				expect.stringContaining(`UPDATE Bejelentes SET statusz = $1 WHERE id = $2 RETURNING *`),
				[true, 1]
			);
	
			// Ellenőrzi, hogy a visszatérési értéket
			expect(updatedReport).toEqual({
				id: 1,
				szoveg: "Fenyegető szotyiscigány aurája van",
				statusz: true,
				felhasznalo_id: 30,
				bejegyzes_id: 7,
				hozzaszolas_id: null
			});
		});
	
		it('should return null if the report ID does not exist', async () => {
			// Mockolt adatbázis-válasz üres sorokkal
			const mockResult = { rowCount: 0, rows: [] };
			database.query.mockResolvedValue(mockResult);
	
			// Meghívja a tesztelendő metódust
			const updatedReport = await ReportDAO.updateReportState(999, false);
	
			// Ellenőrzi, hogy a helyes SQL-lekérdezést hívta meg
			expect(database.query).toHaveBeenCalledWith(
				expect.stringContaining(`UPDATE Bejelentes SET statusz = $1 WHERE id = $2 RETURNING *`),
				[false, 999]
			);
	
			// Ellenőrzi, hogy a visszatérési érték null
			expect(updatedReport).toBeNull();
		});
	
		it('should throw an error if the database query fails', async () => {
			// Mockolja az adatbázis lekérdezés hibáját
			const mockError = new Error('Database error');
			database.query.mockRejectedValue(mockError);
	
			// Ellenőrzi, hogy a metódus hibát dob
			await expect(ReportDAO.updateReportState(1, true)).rejects.toThrow('Database error');
	
			// Ellenőrzi, hogy a helyes SQL-lekérdezést próbálta végrehajtani
			expect(database.query).toHaveBeenCalledWith(
				expect.stringContaining(`UPDATE Bejelentes SET statusz = $1 WHERE id = $2 RETURNING *`),
				[true, 1]
			);
		});
	
    });

    describe('getAllReports()', () => {
        it('should return an array of reports', async () => {
            const mockReportsData = [{
                id: 1,
                felhasznalo_id: 123,
                szoveg: 'Report 1',
                statusz: false,
                bejegyzes_id: 1,
                hozzaszolas_id: null
            }, {
                id: 2,
                felhasznalo_id: 124,
                szoveg: 'Report 2',
                statusz: true,
                bejegyzes_id: 2,
                hozzaszolas_id: null
            }];

            database.query.mockResolvedValueOnce({
                rows: mockReportsData
            });

            const result = await ReportDAO.getAllReports();

            expect(database.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM Bejelentes'));
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(expect.objectContaining({
                id: 1,
                felhasznalo_id: 123,
                szoveg: 'Report 1',
                statusz: false,
                bejegyzes_id: 1,
                hozzaszolas_id: null
            }));
        });

        it('should return an empty array if no reports are found', async () => {
            database.query.mockResolvedValueOnce({
                rows: []
            });

            const result = await ReportDAO.getAllReports();

            expect(result).toEqual([]);
        });

        it('should throw an error if the database query fails', async () => {
            database.query.mockRejectedValueOnce(new Error('Database error'));

            await expect(ReportDAO.getAllReports()).rejects.toThrow('Database error');
        });
    });

    describe('getReportById()', () => {
        it('should return the report with the specified id', async () => {
            const mockReportData = {
                id: 1,
                felhasznalo_id: 123,
                szoveg: 'This is a report',
                statusz: false,
                bejegyzes_id: 1,
                hozzaszolas_id: null
            };

            database.query.mockResolvedValueOnce({
                rows: [mockReportData]
            });

            const result = await ReportDAO.getReportById(mockReportData.id);

            expect(database.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM Bejelentes WHERE id = $1'),
                [mockReportData.id]
            );
            expect(result).toEqual(expect.objectContaining({
                id: 1,
                szoveg: 'This is a report',
                statusz: false,
                felhasznalo_id: 123,
                bejegyzes_id: 1,
                hozzaszolas_id: null
            }));
        });

        it('should return null if no report is found', async () => {
            database.query.mockResolvedValueOnce({ rows: [] });

            const result = await ReportDAO.getReportById(666);

            expect(result).toBeNull();
        });

        it('should throw an error if the database query fails', async () => {
            database.query.mockRejectedValueOnce(new Error('Database error'));

            await expect(ReportDAO.getReportById(1)).rejects.toThrow('Database error');
        });
    });

    describe('deleteReportById()', () => {
        it('should delete a report by id and return true', async () => {
            database.query.mockResolvedValueOnce({ rowCount: 1 });

            const result = await ReportDAO.deleteReportById(1);

            expect(database.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM Bejelentes WHERE id = $1'),
                [1]
            );

            expect(result).toBe(true);
        });

        it('should return false if no report was deleted', async () => {
            database.query.mockResolvedValueOnce({ rowCount: 0 });

            const result = await ReportDAO.deleteReportById(999);

            expect(result).toBe(false);
        });

        it('should throw an error if the database query fails', async () => {
            database.query.mockRejectedValueOnce(new Error('Database error'));

            await expect(ReportDAO.deleteReportById(1)).rejects.toThrow('Database error');
        });
    });
});
