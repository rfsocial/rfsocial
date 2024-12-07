const { convertDateToRelativeTime } = require('../src/app/constants/DateConverter');

describe('convertDateToRelativeTime', () => {
	beforeAll(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2024-11-13T12:00:00Z')); // az aktuális idő rökzítése a tesztekhez
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	test('should return "egy éve" for a date 1 year ago', () => {
		const date = new Date('2023-11-13T12:00:00Z');
		expect(convertDateToRelativeTime(date)).toBe('egy éve');
	});

	test('should return "5 hónapja" for a date 5 months ago', () => {
		const date = new Date('2024-06-13T12:00:00Z');
		expect(convertDateToRelativeTime(date)).toBe('5 hónapja');
	});

	test('should return "2 perce" for a date 2 minutes ago', () => {
		const date = new Date('2024-11-13T11:58:00Z');
		expect(convertDateToRelativeTime(date)).toBe('2 perce');
	});

	test('should return "egy napja" for a date 1 day ago', () => {
		const date = new Date('2024-11-12T12:00:00Z');
		expect(convertDateToRelativeTime(date)).toBe('egy napja');
	});

	test('should return "egy órája" for a date 1 hour ago', () => {
		const date = new Date('2024-11-13T11:00:00Z');
		expect(convertDateToRelativeTime(date)).toBe('egy órája');
	});

	test('should return "egy év múlva" for a date 1 year from now', () => {
		const date = new Date('2025-11-13T12:00:00Z');
		expect(convertDateToRelativeTime(date)).toBe('egy év múlva');
	});

	test('should return "5 hónap múlva" for a date 5 months from now', () => {
		const date = new Date('2025-04-13T12:00:00Z');
		expect(convertDateToRelativeTime(date)).toBe('5 hónap múlva');
	});
});
