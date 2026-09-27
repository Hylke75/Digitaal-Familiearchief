// ---------------------------------------------------------------------------
// Bewora demo dataset — single source of truth.
// This module encodes the demo archive (spec §6–§16) as plain data and expands
// it into the normalised records written to /data/demo/*.json by
// build-demo-data.mjs. It is intentionally dependency-free (plain ESM) so it can
// run under `pnpm seed:demo` without a database or build step.
//
// Everything here is FICTIONAL demo content. No real personal data.
// ---------------------------------------------------------------------------

/** Canonical source registry used by both photos and documents. */
export const SOURCES = {
  apple_photos: { label: "Apple Foto's", brand: '#333333', kind: 'photo' },
  whatsapp: { label: 'WhatsApp', brand: '#25D366', kind: 'photo' },
  instagram: { label: 'Instagram', brand: '#C13584', kind: 'photo' },
  facebook: { label: 'Facebook', brand: '#1877F2', kind: 'photo' },
  google_photos: { label: 'Google Photos', brand: '#4285F4', kind: 'photo' },
  manual_upload: { label: 'Handmatig toegevoegd', brand: '#9B5B19', kind: 'both' },
  google_drive: { label: 'Google Drive', brand: '#1FA463', kind: 'document' },
  onedrive: { label: 'OneDrive', brand: '#0364B8', kind: 'document' },
  dropbox: { label: 'Dropbox', brand: '#0061FF', kind: 'document' },
};

const FAM4 = ['Vader', 'Partner', 'Zoon 1', 'Zoon 2'];

// Compact photo table. Fields left out use the documented defaults
// (datePrecision EXACT_TIME, favorite false). `also` = extra source relations
// (also-found-in). `region` = places bucket for coordinate-bearing photos
// (null → grouped under "Zonder locatie"). `locSource` defaults are derived.
const PHOTOS = [
  { n: 1, file: '01_gezin_strand_scheveningen.jpg', title: 'Gezin op het strand', source: 'apple_photos', also: ['google_photos'], captured: '2026-08-14T19:42:00+02:00', place: 'Scheveningen', city: 'Den Haag', country: 'Nederland', lat: 52.1081, lng: 4.2756, locSource: 'EXIF', region: 'Scheveningen', albums: ['Gezin', 'Zomer', 'Scheveningen'], people: FAM4, tags: ['strand', 'gezin', 'zonsondergang', 'zomer'], favorite: true, versions: [{ label: 'WhatsApp-versie', note: 'Gecomprimeerd', sourceKey: 'whatsapp', relationship: 'WHATSAPP_COMPRESSED_VERSION' }] },
  { n: 2, file: '02_koffie_keukentafel.jpg', title: 'Koffie aan de keukentafel', source: 'apple_photos', captured: '2026-02-11T08:12:00+01:00', place: 'Thuis', city: 'Den Haag', country: 'Nederland', lat: 52.0705, lng: 4.3007, locSource: 'USER', region: 'Den Haag', albums: ['Thuis', 'Dagelijks leven'], people: ['Vader'], tags: ['koffie', 'thuis', 'ochtend', 'werk'] },
  { n: 3, file: '03_zonen_fiets.jpg', title: 'Twee zoons op de fiets', source: 'apple_photos', captured: '2025-04-06T15:35:00+02:00', place: 'Woonwijk', city: 'Den Haag', country: 'Nederland', lat: 52.082, lng: 4.317, locSource: 'EXIF', region: 'Den Haag', albums: ['Gezin', 'Buiten'], people: ['Zoon 1', 'Zoon 2'], tags: ['fiets', 'kinderen', 'lente'] },
  { n: 4, file: '04_verjaardagsdiner_thuis.jpg', title: 'Verjaardagsdiner thuis', source: 'whatsapp', captured: '2025-09-11T20:08:00+02:00', place: 'Thuis', city: 'Den Haag', country: 'Nederland', region: null, albums: ['Verjaardag', 'Gezin'], people: FAM4, tags: ['verjaardag', 'eten', 'familie'], favorite: true },
  { n: 5, file: '05_selfie_wandeling.jpg', title: 'Selfie tijdens wandeling', source: 'whatsapp', captured: '2026-03-22T11:04:00+01:00', place: 'Park', city: 'Den Haag', country: 'Nederland', region: null, albums: ['Samen', 'Dagelijks leven'], people: ['Vader', 'Partner'], tags: ['selfie', 'park', 'wandeling'] },
  { n: 6, file: '06_tennis_madeira.jpg', title: 'Tennisbaan in Madeira', source: 'apple_photos', captured: '2026-07-27T10:48:00+01:00', place: 'Calheta', city: 'Calheta', country: 'Portugal', lat: 32.7216, lng: -17.1687, locSource: 'EXIF', region: 'Madeira', albums: ['Madeira 2026', 'Sport'], people: ['Vader'], tags: ['tennis', 'madeira', 'sport'], override: { place: { value: 'Tennisclub Calheta', providerValue: 'Calheta' } } },
  { n: 7, file: '07_uitzichtpunt_madeira.jpg', title: 'Uitzichtpunt Madeira', source: 'apple_photos', also: ['google_photos'], captured: '2026-07-21T14:18:00+01:00', place: 'Madeira', country: 'Portugal', lat: 32.7607, lng: -17.2112, locSource: 'EXIF', region: 'Madeira', albums: ['Madeira 2026'], people: FAM4, tags: ['madeira', 'uitzicht', 'reis', 'gezin'], favorite: true },
  { n: 8, file: '08_levada_wandeling.jpg', title: 'Levada-wandeling', source: 'apple_photos', also: ['whatsapp'], captured: '2026-07-24T12:02:00+01:00', place: 'Levada Trail', city: 'Madeira', country: 'Portugal', lat: 32.7519, lng: -17.052, locSource: 'EXIF', region: 'Madeira', albums: ['Madeira 2026', 'Hiken'], people: FAM4, tags: ['hiken', 'madeira', 'natuur'] },
  { n: 9, file: '09_diner_funchal.jpg', title: 'Diner op terras in Funchal', source: 'instagram', captured: '2026-07-23T20:36:00+01:00', place: 'Funchal', city: 'Funchal', country: 'Portugal', lat: 32.6496, lng: -16.9098, locSource: 'PROVIDER', region: 'Madeira', albums: ['Madeira 2026', 'Eten'], people: FAM4, tags: [], favorite: true },
  { n: 10, file: '10_fanal_forest.jpg', title: 'Hiken in Fanal Forest', source: 'apple_photos', captured: '2026-07-21T09:54:00+01:00', place: 'Fanal Forest', city: 'Madeira', country: 'Portugal', lat: 32.812, lng: -17.1422, locSource: 'EXIF', region: 'Madeira', albums: ['Madeira 2026', 'Hiken'], people: FAM4, tags: [] },
  { n: 11, file: '11_parijs_straatbeeld.jpg', title: 'Parijs straatbeeld', source: 'apple_photos', captured: '2026-08-14T10:16:00+02:00', city: 'Parijs', country: 'Frankrijk', lat: 48.8566, lng: 2.3522, locSource: 'EXIF', region: 'Parijs', albums: ['Parijs'], people: ['Vader', 'Partner'], tags: [] },
  { n: 12, file: '12_hotelkamer_parijs.jpg', title: 'Hotelkamer in Parijs', source: 'apple_photos', captured: '2026-08-14T08:22:00+02:00', place: 'Hotel', city: 'Parijs', country: 'Frankrijk', lat: 48.8452, lng: 2.3258, locSource: 'EXIF', region: 'Parijs', albums: ['Parijs'], people: [], tags: [] },
  { n: 13, file: '13_golden_gate_gezin.jpg', title: 'Gezin bij Golden Gate Bridge', source: 'google_photos', also: ['apple_photos'], captured: '2025-08-22T13:17:00-07:00', place: 'Golden Gate Bridge', city: 'San Francisco', country: 'VS', lat: 37.8199, lng: -122.4783, locSource: 'EXIF', region: 'San Francisco', albums: ['VS Roadtrip'], people: FAM4, tags: [], favorite: true },
  { n: 14, file: '14_roadtrip_woestijn.jpg', title: 'Roadtrip-auto in de woestijn', source: 'google_photos', captured: '2025-08-26T16:01:00-07:00', place: 'Nevada Desert', country: 'VS', lat: 36.1699, lng: -115.1398, locSource: 'EXIF', region: 'Nevada', albums: ['VS Roadtrip'], people: [], tags: [] },
  { n: 15, file: '15_yosemite_wandeling.jpg', title: 'Wandeling in Yosemite', source: 'apple_photos', captured: '2025-08-28T11:46:00-07:00', place: 'Yosemite National Park', country: 'VS', lat: 37.8651, lng: -119.5383, locSource: 'EXIF', region: 'Yosemite', albums: ['VS Roadtrip', 'Hiken'], people: FAM4, tags: [] },
  { n: 16, file: '16_scan_tuin_1978.jpg', title: 'Familiefoto in de tuin', source: 'manual_upload', captured: '1978-01-01', datePrecision: 'YEAR', place: 'Achtertuin', city: 'Den Haag', country: 'Nederland', region: null, albums: ['Familiearchief'], people: [], tags: ['scan', 'familie', '1978', 'archief'], favorite: true },
  { n: 17, file: '17_trouwfoto_1964_bw.jpg', title: 'Zwart-wit trouwfoto', source: 'manual_upload', captured: '1964-01-01', datePrecision: 'YEAR', city: 'Den Haag', country: 'Nederland', region: null, albums: ['Familiearchief', 'Trouwen'], people: ['Bruidegom', 'Bruid'], tags: [], favorite: true },
  { n: 18, file: '18_schoolfoto_1985.jpg', title: 'Schoolfoto jaren 80', source: 'manual_upload', captured: '1985-01-01', datePrecision: 'YEAR', city: 'Den Haag', country: 'Nederland', region: null, albums: ['Familiearchief', 'Schooltijd'], people: [], tags: [] },
  { n: 19, file: '19_woning_buitenkant.jpg', title: 'Nieuwe woning buitenkant', source: 'apple_photos', also: [{ key: 'google_photos', deleted: true }], captured: '2019-06-18T14:10:00+02:00', city: 'Den Haag', country: 'Nederland', lat: 52.075, lng: 4.308, locSource: 'EXIF', region: 'Den Haag', albums: ['Wonen'], people: [], tags: [] },
  { n: 20, file: '20_verhuisdozen_sleutels.jpg', title: 'Sleuteloverdracht en verhuisdozen', source: 'whatsapp', captured: '2019-06-18T16:24:00+02:00', city: 'Den Haag', country: 'Nederland', region: null, albums: ['Wonen'], people: ['Vader', 'Partner'], tags: [], favorite: true },
  { n: 21, file: '21_netwerkborrel_venue.jpg', title: 'Netwerkborrel', source: 'google_photos', captured: '2025-11-20T17:48:00+01:00', city: 'Hilversum', country: 'Nederland', lat: 52.2292, lng: 5.1669, locSource: 'EXIF', region: 'Hilversum', albums: ['Werk & events'], people: ['Vader'], tags: [] },
  { n: 22, file: '22_spreken_podium.jpg', title: 'Spreken op podium', source: 'instagram', captured: '2026-11-23T15:54:00+01:00', place: 'Grote Kerk', city: 'Den Haag', country: 'Nederland', lat: 52.0795, lng: 4.311, locSource: 'PROVIDER', region: 'Den Haag', albums: ['Werk & events'], people: ['Vader'], tags: [], favorite: true },
  { n: 23, file: '23_kantooroverleg.jpg', title: 'Kantooroverleg', source: 'apple_photos', captured: '2026-01-17T10:28:00+01:00', city: 'Hilversum', country: 'Nederland', lat: 52.23, lng: 5.17, locSource: 'EXIF', region: 'Hilversum', albums: ['Werk'], people: ['Vader', 'Collega 1', 'Collega 2'], tags: [] },
  { n: 24, file: '24_boekpresentatie.jpg', title: 'Boekpresentatie', source: 'facebook', captured: '2026-10-02T16:42:00+02:00', city: 'Hilversum', country: 'Nederland', lat: 52.2292, lng: 5.1669, locSource: 'PROVIDER', region: 'Hilversum', albums: ['Werk & events'], people: ['Vader'], tags: [] },
  { n: 25, file: '25_familie_bbq_whatsapp.jpg', title: 'Familie BBQ', source: 'whatsapp', captured: '2024-07-12T18:57:00+02:00', city: 'Den Haag', country: 'Nederland', region: null, albums: ['Gezin', 'Zomer'], people: [...FAM4, 'Familie'], tags: [] },
  { n: 26, file: '26_hond_op_bank.jpg', title: 'Hond op de bank', source: 'whatsapp', captured: '2025-01-08T21:13:00+01:00', city: 'Den Haag', country: 'Nederland', region: null, albums: ['Dagelijks leven'], people: [], tags: [], favorite: true },
  { n: 27, file: '27_instagram_koffie.jpg', title: 'Koffie in de stad', source: 'instagram', captured: '2026-05-19T11:08:00+02:00', city: 'Amsterdam', country: 'Nederland', lat: 52.3676, lng: 4.9041, locSource: 'PROVIDER', region: 'Amsterdam', albums: ['Koffie & stad'], people: [], tags: [] },
  { n: 28, file: '28_instagram_strand_zonsondergang.jpg', title: 'Zonsondergang op het strand', source: 'instagram', captured: '2026-08-03T20:51:00+02:00', place: 'Scheveningen strand', city: 'Den Haag', country: 'Nederland', lat: 52.1081, lng: 4.2756, locSource: 'PROVIDER', region: 'Scheveningen', albums: ['Strand', 'Zomer'], people: [], tags: [], favorite: true },
  { n: 29, file: '29_paspoort_tafel.jpg', title: 'Paspoort op tafel', source: 'apple_photos', captured: '2026-04-01T09:32:00+02:00', city: 'Den Haag', country: 'Nederland', lat: 52.0705, lng: 4.3007, locSource: 'EXIF', region: 'Den Haag', albums: ['Documenten'], people: [], tags: ['paspoort', 'document', 'identiteit'] },
  { n: 30, file: '30_koopakte_contractmap.jpg', title: 'Koopakte en contractmap', source: 'google_photos', captured: '2019-06-18T17:12:00+02:00', city: 'Den Haag', country: 'Nederland', lat: 52.075, lng: 4.308, locSource: 'EXIF', region: 'Den Haag', albums: ['Documenten', 'Wonen'], people: [], tags: ['koopakte', 'huis', 'contract', 'document'] },
  { n: 31, file: '31_zwembad_zeezicht.jpg', title: 'Zwembad met zeezicht', source: 'apple_photos', captured: '2026-07-22T15:20:00+01:00', place: 'Calheta', city: 'Calheta', country: 'Portugal', lat: 32.72, lng: -17.17, locSource: 'EXIF', region: 'Madeira', albums: ['Madeira 2026'], people: FAM4, tags: ['zwembad', 'madeira', 'zomer'] },
  { n: 32, file: '32_kabelbaan_funchal.jpg', title: 'Kabelbaan in Funchal', source: 'instagram', captured: '2026-07-25T11:10:00+01:00', place: 'Funchal', city: 'Funchal', country: 'Portugal', lat: 32.6496, lng: -16.9098, locSource: 'PROVIDER', region: 'Madeira', albums: ['Madeira 2026'], people: FAM4, tags: ['kabelbaan', 'funchal'] },
  { n: 33, file: '33_markt_funchal.jpg', title: 'Markt in Funchal', source: 'apple_photos', captured: '2026-07-26T09:40:00+01:00', place: 'Funchal', city: 'Funchal', country: 'Portugal', lat: 32.6479, lng: -16.9086, locSource: 'EXIF', region: 'Madeira', albums: ['Madeira 2026', 'Eten'], people: ['Partner'], tags: ['markt', 'fruit'] },
  { n: 34, file: '34_natuurbad_madeira.jpg', title: 'Zwemmen in een natuurbad', source: 'whatsapp', captured: '2026-07-28T13:05:00+01:00', place: 'Porto Moniz', city: 'Madeira', country: 'Portugal', locSource: 'USER', region: 'Madeira', albums: ['Madeira 2026'], people: ['Zoon 1', 'Zoon 2'], tags: ['zwemmen', 'madeira'] },
  { n: 35, file: '35_zonsondergang_madeira.jpg', title: 'Zonsondergang op Madeira', source: 'instagram', captured: '2026-07-29T20:40:00+01:00', place: 'Madeira', country: 'Portugal', lat: 32.75, lng: -17.05, locSource: 'PROVIDER', region: 'Madeira', albums: ['Madeira 2026'], people: [], tags: ['zonsondergang', 'madeira'], favorite: true },
  { n: 36, file: '36_boottocht_dolfijnen.jpg', title: 'Boottocht met dolfijnen', source: 'apple_photos', captured: '2026-07-30T10:15:00+01:00', place: 'Funchal', city: 'Funchal', country: 'Portugal', lat: 32.63, lng: -16.92, locSource: 'EXIF', region: 'Madeira', albums: ['Madeira 2026', 'Natuur'], people: FAM4, tags: ['boot', 'dolfijnen', 'zee'] },
  { n: 37, file: '37_grand_canyon.jpg', title: 'Uitzicht over de Grand Canyon', source: 'google_photos', captured: '2025-08-24T12:30:00-07:00', place: 'Grand Canyon', country: 'VS', lat: 36.1069, lng: -112.1129, locSource: 'EXIF', region: 'Grand Canyon', albums: ['VS Roadtrip'], people: FAM4, tags: ['canyon', 'natuur'], favorite: true },
  { n: 38, file: '38_las_vegas_nacht.jpg', title: 'Las Vegas bij nacht', source: 'apple_photos', captured: '2025-08-25T22:05:00-07:00', place: 'Las Vegas', city: 'Las Vegas', country: 'VS', lat: 36.1147, lng: -115.1728, locSource: 'EXIF', region: 'Las Vegas', albums: ['VS Roadtrip'], people: ['Vader', 'Partner'], tags: ['vegas', 'nacht'] },
  { n: 39, file: '39_route66_bord.jpg', title: 'Route 66-bord', source: 'google_photos', captured: '2025-08-27T14:50:00-07:00', place: 'Route 66', country: 'VS', lat: 35.02, lng: -114.36, locSource: 'EXIF', region: 'Nevada', albums: ['VS Roadtrip'], people: [], tags: ['route66', 'weg'] },
  { n: 40, file: '40_motel_woestijn.jpg', title: 'Motel langs de weg', source: 'apple_photos', captured: '2025-08-27T18:20:00-07:00', place: 'Nevada', country: 'VS', lat: 36.2, lng: -115.2, locSource: 'EXIF', region: 'Nevada', albums: ['VS Roadtrip'], people: [], tags: ['motel', 'roadtrip'] },
  { n: 41, file: '41_redwoods_bos.jpg', title: 'Tussen de redwoods', source: 'apple_photos', captured: '2025-08-29T11:00:00-07:00', place: 'Redwood National Park', country: 'VS', lat: 41.2132, lng: -124.0046, locSource: 'EXIF', region: 'Californië', albums: ['VS Roadtrip', 'Natuur'], people: FAM4, tags: ['redwoods', 'bos'] },
  { n: 42, file: '42_diner_san_francisco.jpg', title: 'Amerikaans diner', source: 'instagram', captured: '2025-08-23T19:30:00-07:00', place: 'San Francisco', city: 'San Francisco', country: 'VS', lat: 37.7749, lng: -122.4194, locSource: 'PROVIDER', region: 'San Francisco', albums: ['VS Roadtrip', 'Eten'], people: [], tags: ['diner', 'eten'] },
  { n: 43, file: '43_eiffeltoren.jpg', title: 'Eiffeltoren', source: 'apple_photos', captured: '2026-08-15T16:40:00+02:00', city: 'Parijs', country: 'Frankrijk', lat: 48.8584, lng: 2.2945, locSource: 'EXIF', region: 'Parijs', albums: ['Parijs'], people: ['Vader', 'Partner'], tags: ['eiffeltoren', 'parijs'], favorite: true, portrait: true },
  { n: 44, file: '44_louvre_piramide.jpg', title: 'Louvre-piramide', source: 'instagram', captured: '2026-08-15T11:20:00+02:00', city: 'Parijs', country: 'Frankrijk', lat: 48.8606, lng: 2.3376, locSource: 'PROVIDER', region: 'Parijs', albums: ['Parijs'], people: [], tags: ['louvre', 'kunst'] },
  { n: 45, file: '45_croissant_koffie.jpg', title: 'Croissant en koffie', source: 'instagram', captured: '2026-08-16T08:50:00+02:00', city: 'Parijs', country: 'Frankrijk', lat: 48.8566, lng: 2.3522, locSource: 'PROVIDER', region: 'Parijs', albums: ['Parijs', 'Koffie & stad', 'Eten'], people: [], tags: ['croissant', 'koffie'] },
  { n: 46, file: '46_seine_avond.jpg', title: 'De Seine bij avond', source: 'apple_photos', captured: '2026-08-16T21:10:00+02:00', city: 'Parijs', country: 'Frankrijk', lat: 48.8566, lng: 2.3522, locSource: 'EXIF', region: 'Parijs', albums: ['Parijs'], people: ['Vader', 'Partner'], tags: ['seine', 'avond'] },
  { n: 47, file: '47_sagrada_familia.jpg', title: 'Sagrada Família', source: 'apple_photos', captured: '2024-09-14T15:00:00+02:00', city: 'Barcelona', country: 'Spanje', lat: 41.4036, lng: 2.1744, locSource: 'EXIF', region: 'Barcelona', albums: ['Barcelona 2024'], people: ['Vader', 'Partner'], tags: ['sagrada', 'barcelona'], favorite: true, portrait: true },
  { n: 48, file: '48_park_guell.jpg', title: 'Park Güell', source: 'instagram', captured: '2024-09-15T12:30:00+02:00', city: 'Barcelona', country: 'Spanje', lat: 41.4145, lng: 2.1527, locSource: 'PROVIDER', region: 'Barcelona', albums: ['Barcelona 2024'], people: [], tags: ['park', 'gaudi'] },
  { n: 49, file: '49_tapas_diner.jpg', title: 'Tapas-diner', source: 'whatsapp', captured: '2024-09-15T21:00:00+02:00', place: 'Barcelona', city: 'Barcelona', country: 'Spanje', locSource: 'USER', region: 'Barcelona', albums: ['Barcelona 2024', 'Eten'], people: ['Vader', 'Partner', 'Vriend 1', 'Vriend 2'], tags: ['tapas', 'eten'] },
  { n: 50, file: '50_strand_barceloneta.jpg', title: 'Strand van Barceloneta', source: 'instagram', captured: '2024-09-16T14:20:00+02:00', place: 'Barceloneta', city: 'Barcelona', country: 'Spanje', lat: 41.3785, lng: 2.1925, locSource: 'PROVIDER', region: 'Barcelona', albums: ['Barcelona 2024', 'Strand'], people: [], tags: ['strand', 'barcelona'] },
  { n: 51, file: '51_big_ben.jpg', title: 'Big Ben', source: 'apple_photos', captured: '2025-11-08T13:15:00+00:00', city: 'Londen', country: 'Verenigd Koninkrijk', lat: 51.5007, lng: -0.1246, locSource: 'EXIF', region: 'Londen', albums: ['Londen 2025'], people: ['Vader', 'Partner'], tags: ['bigben', 'londen'], portrait: true },
  { n: 52, file: '52_tower_bridge.jpg', title: 'Tower Bridge', source: 'instagram', captured: '2025-11-08T16:45:00+00:00', city: 'Londen', country: 'Verenigd Koninkrijk', lat: 51.5055, lng: -0.0754, locSource: 'PROVIDER', region: 'Londen', albums: ['Londen 2025'], people: [], tags: ['towerbridge', 'londen'], favorite: true },
  { n: 53, file: '53_pub_londen.jpg', title: 'Pub in Londen', source: 'whatsapp', captured: '2025-11-09T19:30:00+00:00', place: 'Londen', city: 'Londen', country: 'Verenigd Koninkrijk', locSource: 'USER', region: 'Londen', albums: ['Londen 2025', 'Eten'], people: ['Vader', 'Vriend 1'], tags: ['pub', 'londen'] },
  { n: 54, file: '54_fietsen_gracht.jpg', title: 'Fietsen langs de gracht', source: 'apple_photos', captured: '2026-05-03T16:10:00+02:00', place: 'Den Haag', city: 'Den Haag', country: 'Nederland', lat: 52.078, lng: 4.31, locSource: 'EXIF', region: 'Den Haag', albums: ['Dagelijks leven', 'Buiten'], people: [], tags: ['fiets', 'gracht'] },
  { n: 55, file: '55_markt_plein.jpg', title: 'Markt op het plein', source: 'whatsapp', captured: '2026-05-10T10:30:00+02:00', city: 'Den Haag', country: 'Nederland', region: null, albums: ['Dagelijks leven'], people: ['Partner'], tags: ['markt', 'stad'] },
  { n: 56, file: '56_herfst_bos.jpg', title: 'Herfst in het bos', source: 'apple_photos', captured: '2025-10-19T15:20:00+02:00', place: 'Haagse Bos', city: 'Den Haag', country: 'Nederland', lat: 52.09, lng: 4.32, locSource: 'EXIF', region: 'Den Haag', albums: ['Herfst', 'Natuur'], people: FAM4, tags: ['herfst', 'bos'], favorite: true },
  { n: 57, file: '57_koken_keuken.jpg', title: 'Koken in de keuken', source: 'apple_photos', captured: '2026-01-28T18:40:00+01:00', place: 'Thuis', city: 'Den Haag', country: 'Nederland', lat: 52.0705, lng: 4.3007, locSource: 'USER', region: 'Den Haag', albums: ['Koken', 'Thuis'], people: ['Partner'], tags: ['koken', 'thuis'] },
  { n: 58, file: '58_kerstboom_thuis.jpg', title: 'Kerstboom thuis', source: 'whatsapp', captured: '2025-12-20T19:00:00+01:00', city: 'Den Haag', country: 'Nederland', region: null, albums: ['Kerst', 'Thuis', 'Gezin'], people: [...FAM4, 'Zus'], tags: ['kerst', 'thuis'], favorite: true },
  { n: 59, file: '59_sinterklaas_cadeaus.jpg', title: 'Sinterklaascadeaus', source: 'whatsapp', captured: '2025-12-05T20:15:00+01:00', city: 'Den Haag', country: 'Nederland', region: null, albums: ['Sinterklaas', 'Gezin'], people: ['Zoon 1', 'Zoon 2'], tags: ['sinterklaas', 'cadeaus'] },
  { n: 60, file: '60_regen_raam.jpg', title: 'Regen op het raam', source: 'apple_photos', captured: '2026-11-12T14:25:00+01:00', place: 'Thuis', city: 'Den Haag', country: 'Nederland', lat: 52.0705, lng: 4.3007, locSource: 'USER', region: 'Den Haag', albums: ['Dagelijks leven'], people: [], tags: ['regen', 'thuis'] },
  { n: 61, file: '61_ontbijt_tuin.jpg', title: 'Ontbijt in de tuin', source: 'apple_photos', captured: '2026-06-14T09:10:00+02:00', place: 'Thuis', city: 'Den Haag', country: 'Nederland', lat: 52.0705, lng: 4.3007, locSource: 'USER', region: 'Den Haag', albums: ['Thuis', 'Eten'], people: ['Partner'], tags: ['ontbijt', 'tuin'] },
  { n: 62, file: '62_voetbaltraining.jpg', title: 'Voetbaltraining', source: 'whatsapp', captured: '2025-09-06T10:00:00+02:00', city: 'Den Haag', country: 'Nederland', region: null, albums: ['Sport', 'Gezin'], people: ['Zoon 1'], tags: ['voetbal', 'sport'] },
  { n: 63, file: '63_verjaardagstaart.jpg', title: 'Verjaardagstaart', source: 'whatsapp', captured: '2026-02-11T17:30:00+01:00', city: 'Den Haag', country: 'Nederland', region: null, albums: ['Verjaardag'], people: ['Vader'], tags: ['taart', 'verjaardag'] },
  { n: 64, file: '64_wandeling_park.jpg', title: 'Wandeling in het park', source: 'apple_photos', captured: '2026-04-20T15:45:00+02:00', place: 'Zuiderpark', city: 'Den Haag', country: 'Nederland', lat: 52.05, lng: 4.29, locSource: 'EXIF', region: 'Den Haag', albums: ['Samen', 'Dagelijks leven'], people: ['Vader', 'Partner'], tags: ['wandeling', 'park'] },
  { n: 65, file: '65_lezen_thuis.jpg', title: 'Lezen op de bank', source: 'apple_photos', captured: '2026-03-08T20:00:00+01:00', place: 'Thuis', city: 'Den Haag', country: 'Nederland', lat: 52.0705, lng: 4.3007, locSource: 'USER', region: 'Den Haag', albums: ['Dagelijks leven'], people: [], tags: ['lezen', 'thuis'] },
  { n: 66, file: '66_concert_amsterdam.jpg', title: 'Concert in Amsterdam', source: 'instagram', captured: '2026-06-28T21:30:00+02:00', city: 'Amsterdam', country: 'Nederland', lat: 52.3676, lng: 4.9041, locSource: 'PROVIDER', region: 'Amsterdam', albums: ['Concert', 'Stedentrip'], people: ['Vader', 'Vriend 1'], tags: ['concert', 'muziek'], favorite: true },
  { n: 67, file: '67_museum_amsterdam.jpg', title: 'Museumbezoek', source: 'apple_photos', captured: '2025-03-15T13:00:00+01:00', city: 'Amsterdam', country: 'Nederland', lat: 52.36, lng: 4.885, locSource: 'EXIF', region: 'Amsterdam', albums: ['Stedentrip'], people: ['Partner'], tags: ['museum', 'kunst'] },
  { n: 68, file: '68_rondvaart_amsterdam.jpg', title: 'Rondvaart door de grachten', source: 'instagram', captured: '2025-07-05T15:40:00+02:00', city: 'Amsterdam', country: 'Nederland', lat: 52.3676, lng: 4.9041, locSource: 'PROVIDER', region: 'Amsterdam', albums: ['Stedentrip'], people: FAM4, tags: ['rondvaart', 'gracht'] },
  { n: 69, file: '69_rotterdam_skyline.jpg', title: 'Rotterdamse skyline', source: 'apple_photos', captured: '2025-06-11T18:00:00+02:00', city: 'Rotterdam', country: 'Nederland', lat: 51.9244, lng: 4.4777, locSource: 'EXIF', region: 'Rotterdam', albums: ['Stedentrip'], people: ['Vader', 'Partner'], tags: ['rotterdam', 'skyline'] },
  { n: 70, file: '70_utrecht_gracht.jpg', title: 'Utrechtse werf', source: 'instagram', captured: '2024-08-30T16:20:00+02:00', city: 'Utrecht', country: 'Nederland', lat: 52.0907, lng: 5.1214, locSource: 'PROVIDER', region: 'Utrecht', albums: ['Stedentrip'], people: [], tags: ['utrecht', 'gracht'] },
  { n: 71, file: '71_conferentie_zaal.jpg', title: 'Conferentiezaal', source: 'google_photos', captured: '2026-03-19T10:30:00+01:00', city: 'Hilversum', country: 'Nederland', lat: 52.2292, lng: 5.1669, locSource: 'EXIF', region: 'Hilversum', albums: ['Werk & events'], people: ['Vader'], tags: ['conferentie', 'werk'] },
  { n: 72, file: '72_workshop_team.jpg', title: 'Workshop met het team', source: 'apple_photos', captured: '2026-02-05T14:00:00+01:00', city: 'Hilversum', country: 'Nederland', lat: 52.23, lng: 5.17, locSource: 'EXIF', region: 'Hilversum', albums: ['Werk'], people: ['Vader', 'Collega 1', 'Collega 2'], tags: ['workshop', 'team'] },
  { n: 73, file: '73_award_uitreiking.jpg', title: 'Award-uitreiking', source: 'facebook', captured: '2025-12-11T20:30:00+01:00', city: 'Hilversum', country: 'Nederland', lat: 52.2292, lng: 5.1669, locSource: 'PROVIDER', region: 'Hilversum', albums: ['Werk & events'], people: ['Vader'], tags: ['award', 'prijs'], favorite: true },
  { n: 74, file: '74_team_lunch.jpg', title: 'Teamlunch', source: 'whatsapp', captured: '2026-01-22T12:30:00+01:00', city: 'Hilversum', country: 'Nederland', region: null, albums: ['Werk'], people: ['Vader', 'Collega 1', 'Collega 2'], tags: ['lunch', 'team'] },
  { n: 75, file: '75_interview_locatie.jpg', title: 'Interview op locatie', source: 'instagram', captured: '2026-09-18T11:00:00+02:00', place: 'Den Haag', city: 'Den Haag', country: 'Nederland', lat: 52.08, lng: 4.31, locSource: 'PROVIDER', region: 'Den Haag', albums: ['Werk & events'], people: ['Vader'], tags: ['interview', 'media'] },
  { n: 76, file: '76_beursstand.jpg', title: 'Beursstand', source: 'google_photos', captured: '2026-04-11T13:20:00+02:00', city: 'Utrecht', country: 'Nederland', lat: 52.0907, lng: 5.1214, locSource: 'EXIF', region: 'Utrecht', albums: ['Werk & events'], people: ['Vader'], tags: ['beurs', 'stand'] },
  { n: 77, file: '77_podcast_opname.jpg', title: 'Podcast-opname', source: 'apple_photos', captured: '2026-05-27T15:00:00+02:00', city: 'Hilversum', country: 'Nederland', lat: 52.23, lng: 5.17, locSource: 'EXIF', region: 'Hilversum', albums: ['Werk'], people: ['Vader', 'Vriend 2'], tags: ['podcast', 'opname'] },
  { n: 78, file: '78_netwerklunch.jpg', title: 'Netwerklunch', source: 'whatsapp', captured: '2025-10-30T12:45:00+01:00', city: 'Den Haag', country: 'Nederland', region: null, albums: ['Werk & events'], people: ['Vader'], tags: ['netwerk', 'lunch'] },
  { n: 79, file: '79_caravan_1982.jpg', title: 'Vakantie met de caravan', source: 'manual_upload', captured: '1982-01-01', datePrecision: 'YEAR', country: 'Nederland', region: null, albums: ['Familiearchief'], people: ['Oma', 'Opa'], tags: ['caravan', 'vakantie', 'archief'] },
  { n: 80, file: '80_communie_1990.jpg', title: 'Communiefoto', source: 'manual_upload', captured: '1990-01-01', datePrecision: 'YEAR', city: 'Den Haag', country: 'Nederland', region: null, albums: ['Familiearchief'], people: [], tags: ['communie', 'archief'], portrait: true },
  { n: 81, file: '81_opa_oma_1975.jpg', title: 'Opa en oma', source: 'manual_upload', captured: '1975-01-01', datePrecision: 'YEAR', country: 'Nederland', region: null, albums: ['Familiearchief'], people: ['Oma', 'Opa'], tags: ['portret', 'archief'], favorite: true, portrait: true },
  { n: 82, file: '82_baby_1988.jpg', title: 'Babyfoto', source: 'manual_upload', captured: '1988-01-01', datePrecision: 'YEAR', city: 'Den Haag', country: 'Nederland', region: null, albums: ['Familiearchief'], people: [], tags: ['baby', 'archief'] },
  { n: 83, file: '83_schoolklas_1992.jpg', title: 'Schoolklas', source: 'manual_upload', captured: '1992-01-01', datePrecision: 'YEAR', city: 'Den Haag', country: 'Nederland', region: null, albums: ['Familiearchief', 'Schooltijd'], people: [], tags: ['school', 'klas', 'archief'] },
  { n: 84, file: '84_bruiloft_1994.jpg', title: 'Bruiloftsfeest', source: 'manual_upload', captured: '1994-01-01', datePrecision: 'YEAR', city: 'Den Haag', country: 'Nederland', region: null, albums: ['Familiearchief', 'Trouwen'], people: [], tags: ['bruiloft', 'feest', 'archief'] },
  { n: 85, file: '85_strandvakantie_1996.jpg', title: 'Strandvakantie', source: 'manual_upload', captured: '1996-01-01', datePrecision: 'YEAR', country: 'Nederland', region: null, albums: ['Familiearchief', 'Strand'], people: [], tags: ['strand', 'vakantie', 'archief'] },
  { n: 86, file: '86_kerst_1985.jpg', title: 'Kerst vroeger', source: 'manual_upload', captured: '1985-12-01', datePrecision: 'MONTH', country: 'Nederland', region: null, albums: ['Familiearchief', 'Kerst'], people: [], tags: ['kerst', 'archief'] },
  { n: 87, file: '87_hond_park.jpg', title: 'Hond in het park', source: 'whatsapp', captured: '2025-05-18T16:30:00+02:00', city: 'Den Haag', country: 'Nederland', region: null, albums: ['Dagelijks leven'], people: [], tags: ['hond', 'park'] },
  { n: 88, file: '88_hardlopen_zonsopkomst.jpg', title: 'Hardlopen bij zonsopkomst', source: 'apple_photos', captured: '2026-06-02T06:20:00+02:00', place: 'Scheveningen', city: 'Den Haag', country: 'Nederland', lat: 52.1081, lng: 4.2756, locSource: 'EXIF', region: 'Scheveningen', albums: ['Sport'], people: ['Vader'], tags: ['hardlopen', 'ochtend'] },
  { n: 89, file: '89_picknick_gras.jpg', title: 'Picknick in het gras', source: 'instagram', captured: '2026-07-06T13:00:00+02:00', place: 'Zuiderpark', city: 'Den Haag', country: 'Nederland', lat: 52.05, lng: 4.29, locSource: 'PROVIDER', region: 'Den Haag', albums: ['Samen', 'Zomer'], people: ['Vader', 'Partner', 'Vriend 1', 'Vriend 2'], tags: ['picknick', 'zomer'] },
  { n: 90, file: '90_nieuwjaar_vuurwerk.jpg', title: 'Nieuwjaar met vuurwerk', source: 'whatsapp', captured: '2025-12-31T23:59:00+01:00', city: 'Den Haag', country: 'Nederland', region: null, albums: ['Winter'], people: FAM4, tags: ['vuurwerk', 'nieuwjaar'], favorite: true },
];

// Region centroids for the places map (approximate, demo only).
export const REGION_CENTROIDS = {
  'Den Haag': { lat: 52.0767, lng: 4.3007 },
  Scheveningen: { lat: 52.1081, lng: 4.2756 },
  Madeira: { lat: 32.7607, lng: -17.0 },
  Parijs: { lat: 48.8566, lng: 2.3522 },
  'San Francisco': { lat: 37.8199, lng: -122.4783 },
  Nevada: { lat: 36.1699, lng: -115.1398 },
  Yosemite: { lat: 37.8651, lng: -119.5383 },
  Hilversum: { lat: 52.2292, lng: 5.1669 },
  Amsterdam: { lat: 52.3676, lng: 4.9041 },
  'Grand Canyon': { lat: 36.1069, lng: -112.1129 },
  'Las Vegas': { lat: 36.1147, lng: -115.1728 },
  Californië: { lat: 41.2132, lng: -124.0046 },
  Barcelona: { lat: 41.3874, lng: 2.1686 },
  Londen: { lat: 51.5074, lng: -0.1278 },
  Rotterdam: { lat: 51.9244, lng: 4.4777 },
  Utrecht: { lat: 52.0907, lng: 5.1214 },
};

export const PEOPLE = [
  { name: 'Vader', role: 'Archiefeigenaar', color: '#1D3D2A' },
  { name: 'Partner', role: 'Partner', color: '#9B5B19' },
  { name: 'Zoon 1', role: 'Zoon', color: '#2F6F4F' },
  { name: 'Zoon 2', role: 'Zoon', color: '#3B7D8C' },
  { name: 'Familie', role: 'Familie', color: '#8A6D3B' },
  { name: 'Collega 1', role: 'Collega', color: '#5B6B7B' },
  { name: 'Collega 2', role: 'Collega', color: '#7B5B6B' },
  { name: 'Bruidegom', role: 'Familiearchief', color: '#444444' },
  { name: 'Bruid', role: 'Familiearchief', color: '#6B4A5B' },
  { name: 'Oma', role: 'Familie', color: '#7A5C3B' },
  { name: 'Opa', role: 'Familie', color: '#4B5B45' },
  { name: 'Zus', role: 'Familie', color: '#9B4B6B' },
  { name: 'Vriend 1', role: 'Vriend', color: '#3B6B7B' },
  { name: 'Vriend 2', role: 'Vriend', color: '#6B6B3B' },
];

// Album list (§10) — union with any album referenced by a photo is computed at build.
export const ALBUM_NAMES = [
  'Gezin', 'Zomer', 'Scheveningen', 'Thuis', 'Dagelijks leven', 'Verjaardag', 'Samen',
  'Madeira 2026', 'Sport', 'Hiken', 'Eten', 'Parijs', 'VS Roadtrip', 'Familiearchief',
  'Trouwen', 'Schooltijd', 'Wonen', 'Werk & events', 'Werk', 'Koffie & stad', 'Strand', 'Documenten',
];

// Smart albums (§11) — dynamic rules evaluated by the app.
export const SMART_ALBUMS = [
  { id: 'smart-whatsapp-2025', title: 'WhatsApp 2025', rule: { source: 'whatsapp', year: 2025 } },
  { id: 'smart-madeira', title: 'Madeira', rule: { placeContains: 'Madeira' } },
  { id: 'smart-favorieten', title: 'Favorieten', rule: { favorite: true } },
  { id: 'smart-oude-familiefotos', title: "Oude familiefoto's", rule: { beforeYear: 1990 } },
];

// Document source folder trees (§13). Preserved verbatim as SOURCE structure.
export const FOLDERS = {
  google_drive: {
    label: 'Google Drive',
    root: 'Mijn Drive',
    tree: {
      'Mijn Drive': {
        Privé: {
          Huis: { Hypotheek: {}, Verzekeringen: {}, Verbouwing: {} },
          Belastingen: {},
          Opleiding: {},
        },
        Werk: {},
      },
    },
  },
  onedrive: {
    label: 'OneDrive',
    root: 'Documenten',
    tree: { Documenten: { Financieel: {}, Contracten: {}, Persoonlijk: {} } },
  },
  dropbox: {
    label: 'Dropbox',
    root: 'Persoonlijk',
    tree: { Persoonlijk: { Huis: {}, Administratie: {} } },
  },
};

// 24 documents (§12). folder = path within the source (leaf), matching FOLDERS.
export const DOCUMENTS = [
  { title: 'Koopakte woning.pdf', category: 'Woning', source: 'google_drive', folder: 'Mijn Drive/Privé/Huis/Hypotheek', date: '2019-06-18', tags: ['koopakte', 'huis', 'notaris'] },
  { title: 'Hypotheekofferte.pdf', category: 'Financieel', source: 'google_drive', folder: 'Mijn Drive/Privé/Huis/Hypotheek', date: '2019-05-20', tags: ['hypotheek', 'huis'] },
  { title: 'Notaris afrekening.pdf', category: 'Woning', source: 'google_drive', folder: 'Mijn Drive/Privé/Huis/Hypotheek', date: '2019-06-18', tags: ['notaris', 'huis'] },
  { title: 'Taxatierapport.pdf', category: 'Woning', source: 'onedrive', folder: 'Documenten/Financieel', date: '2019-05-10', tags: ['taxatie', 'huis'] },
  { title: 'WOZ beschikking 2026.pdf', category: 'Belasting', source: 'google_drive', folder: 'Mijn Drive/Privé/Belastingen', date: '2026-02-28', tags: ['woz', 'gemeente'] },
  { title: 'Opstalverzekering.pdf', category: 'Verzekeringen', source: 'google_drive', folder: 'Mijn Drive/Privé/Huis/Verzekeringen', date: '2019-07-01', tags: ['verzekering', 'huis'] },
  { title: 'Inboedelverzekering.pdf', category: 'Verzekeringen', source: 'google_drive', folder: 'Mijn Drive/Privé/Huis/Verzekeringen', date: '2019-07-01', tags: ['verzekering', 'inboedel'] },
  { title: 'Jaaropgave 2025.pdf', category: 'Financieel', source: 'google_drive', folder: 'Mijn Drive/Privé/Belastingen', date: '2026-01-15', tags: ['jaaropgave', 'inkomen'] },
  { title: 'Belastingaangifte 2025.pdf', category: 'Belasting', source: 'google_drive', folder: 'Mijn Drive/Privé/Belastingen', date: '2026-04-30', tags: ['belasting', 'aangifte'] },
  { title: 'Bankoverzicht jaar 2025.pdf', category: 'Financieel', source: 'onedrive', folder: 'Documenten/Financieel', date: '2026-01-05', tags: ['bank', 'overzicht'] },
  { title: 'Arbeidsovereenkomst.pdf', category: 'Contracten', source: 'google_drive', folder: 'Mijn Drive/Werk', date: '2015-08-24', tags: ['werk', 'contract'] },
  { title: 'Pensioenoverzicht.pdf', category: 'Financieel', source: 'google_drive', folder: 'Mijn Drive/Werk', date: '2025-11-30', tags: ['pensioen'] },
  { title: 'Diploma.pdf', category: 'Opleiding', source: 'google_drive', folder: 'Mijn Drive/Privé/Opleiding', date: '2009-06-30', tags: ['diploma', 'opleiding'] },
  { title: 'Cursuscertificaat.pdf', category: 'Opleiding', source: 'google_drive', folder: 'Mijn Drive/Privé/Opleiding', date: '2022-03-18', tags: ['cursus', 'certificaat'] },
  { title: 'Energiecontract.pdf', category: 'Contracten', source: 'onedrive', folder: 'Documenten/Contracten', date: '2023-09-01', tags: ['energie', 'contract'] },
  { title: 'Internetcontract.pdf', category: 'Contracten', source: 'onedrive', folder: 'Documenten/Contracten', date: '2024-02-14', tags: ['internet', 'contract'] },
  { title: 'Reisverzekering.pdf', category: 'Verzekeringen', source: 'onedrive', folder: 'Documenten/Persoonlijk', date: '2026-06-20', tags: ['reis', 'verzekering'] },
  { title: 'Autoverzekering.pdf', category: 'Verzekeringen', source: 'dropbox', folder: 'Persoonlijk/Administratie', date: '2025-01-11', tags: ['auto', 'verzekering'] },
  { title: 'Factuur verbouwing.pdf', category: 'Woning', source: 'google_drive', folder: 'Mijn Drive/Privé/Huis/Verbouwing', date: '2021-05-06', tags: ['verbouwing', 'factuur'] },
  { title: 'Garantiebewijs keuken.pdf', category: 'Woning', source: 'google_drive', folder: 'Mijn Drive/Privé/Huis/Verbouwing', date: '2021-05-20', tags: ['garantie', 'keuken'] },
  { title: 'Gemeentelijke belasting.pdf', category: 'Belasting', source: 'dropbox', folder: 'Persoonlijk/Administratie', date: '2026-03-01', tags: ['gemeente', 'belasting'] },
  { title: 'Schooldocument.pdf', category: 'Opleiding', source: 'dropbox', folder: 'Persoonlijk/Huis', date: '2018-09-03', tags: ['school', 'opleiding'] },
  { title: 'Leasecontract.pdf', category: 'Contracten', source: 'onedrive', folder: 'Documenten/Contracten', date: '2024-07-01', tags: ['lease', 'contract'] },
  { title: 'Overig document.pdf', category: 'Overig', source: 'manual_upload', folder: null, date: '2026-08-01', tags: ['overig'] },
];

export const DOCUMENT_CATEGORIES = ['Woning', 'Financieel', 'Verzekeringen', 'Contracten', 'Belasting', 'Opleiding', 'Overig'];

// Memories (§15) + external Beeld & Geluid reference (§16). photoNs / docTitles
// link by number/title; expanded to ids at build time.
export const MEMORIES = [
  { title: 'Trouwdag familie', date: '1964-01-01', datePrecision: 'YEAR', place: 'Den Haag', story: 'De trouwdag van de grootouders — het begin van het familiearchief.', photoNs: [17] },
  { title: 'Zomer in de tuin', date: '1978-01-01', datePrecision: 'YEAR', place: 'Den Haag', story: 'Een warme zomer in de achtertuin, vastgelegd op een ingescande foto.', photoNs: [16] },
  { title: 'Schooltijd', date: '1985-01-01', datePrecision: 'YEAR', place: 'Den Haag', story: 'Een klassieke schoolfoto uit de jaren tachtig.', photoNs: [18] },
  { title: 'Nieuwe woning', date: '2019-06-18', datePrecision: 'DATE', place: 'Den Haag', story: 'De sleuteloverdracht van het nieuwe huis — foto’s en de bijbehorende papieren bij elkaar.', photoNs: [19, 20, 30], docTitles: ['Koopakte woning.pdf', 'Hypotheekofferte.pdf', 'Taxatierapport.pdf'] },
  { title: 'Familie BBQ', date: '2024-07-12', datePrecision: 'DATE', place: 'Den Haag', story: 'Een zomerse barbecue met de hele familie.', photoNs: [25] },
  { title: 'Roadtrip Verenigde Staten', date: '2025-08-01', datePrecision: 'MONTH', place: 'Verenigde Staten', story: 'Een roadtrip langs de westkust: Golden Gate, de woestijn en Yosemite.', photoNs: [13, 14, 15] },
  { title: 'Verjaardag', date: '2025-09-11', datePrecision: 'DATE', place: 'Den Haag', story: 'Een verjaardagsdiner thuis met het gezin.', photoNs: [4] },
  { title: 'Madeira', date: '2026-07-01', datePrecision: 'MONTH', place: 'Madeira', story: 'Een week Madeira: tennis, uitzichten, levada-wandelingen en dineren in Funchal.', photoNs: [6, 7, 8, 9, 10] },
  { title: 'Parijs', date: '2026-08-14', datePrecision: 'MONTH', place: 'Parijs', story: 'Een stedentrip naar Parijs.', photoNs: [11, 12] },
  { title: 'Avond op Scheveningen', date: '2026-08-03', datePrecision: 'DATE', place: 'Scheveningen', story: 'Zonsondergang op het strand van Scheveningen.', photoNs: [28] },
  { title: 'Boekpresentatie', date: '2026-10-02', datePrecision: 'MONTH', place: 'Hilversum', story: 'De presentatie van een nieuw boek.', photoNs: [24] },
  { title: 'Spreken op evenement', date: '2026-11-23', datePrecision: 'MONTH', place: 'Den Haag', story: 'Een lezing op een evenement in de Grote Kerk.', photoNs: [22] },
  {
    title: 'Mijn eerste televisieoptreden',
    date: '2000-01-01',
    datePrecision: 'YEAR',
    place: null,
    story: 'Een demonstratie van hoe een extern archieffragment straks aan je herinneringen kan worden gekoppeld.',
    photoNs: [],
    externalReference: {
      provider: 'Beeld & Geluid',
      programme: 'Demo-programma',
      date: '2000',
      fragmentStart: '17:28',
      fragmentEnd: '19:12',
      status: 'DEMO',
    },
  },
];

export { PHOTOS };
