const test = require('tape');

const logger = {debug: () => {}, info: () => {}, error: () => {}, warn: () => {}, child: () => logger};
const {consolidateTranscripts} = require('../lib/utils/transcription-utils')(logger);

const chunks = (...transcripts) => transcripts.map((transcript) => ({
  is_final: true,
  alternatives: [{transcript, confidence: 0.9}]
}));
const joined = (vendor, ...transcripts) =>
  consolidateTranscripts(chunks(...transcripts), 1, 'es', vendor).alternatives[0].transcript;

test('speechmatics: a digit chunk keeps its space before the next word', (t) => {
  t.equal(joined('speechmatics', '21 ', 'horas. '), '21 horas.');
  t.equal(joined('speechmatics', 'Para ', '12 ', 'personas. '), 'Para 12 personas.');
  t.equal(joined('speechmatics', '15 ', 'de diciembre ', '. '), '15 de diciembre.');
  t.equal(joined('speechmatics', 'A las ', '15 40 ', 'y cinco. '), 'A las 15 40 y cinco.');
  t.equal(joined('speechmatics', 'A las ', '21 ', 'cero cero. '), 'A las 21 cero cero.');
  t.end();
});

test('speechmatics: punctuation chunks attach to the previous word', (t) => {
  t.equal(joined('speechmatics', 'Reserva ', '. '), 'Reserva.');
  t.equal(joined('speechmatics', 'Dos ', 'menos ', '4.º ', '. '), 'Dos menos 4.º.');
  t.equal(joined('speechmatics', '¿ ', 'Tenéis parking ', '? '), '¿Tenéis parking?');
  t.equal(joined('speechmatics', 'Bueno ', ', pues ', 'quería decir ', 'que ', 'soy ', 'alérgico ', '. '), 'Bueno, pues quería decir que soy alérgico.');
  t.end();
});

test('speechmatics: a single chunk is tidied too', (t) => {
  t.equal(joined('speechmatics', 'Si . '), 'Si.');
  t.equal(joined('speechmatics', 'Nada más. '), 'Nada más.');
  t.end();
});

test('other vendors keep joining dictated digits', (t) => {
  t.equal(joined('microsoft', '6 1 2 ', '3 4 5.'), '612345');
  t.equal(joined('google', 'para las', 'nueve'), 'para las nueve');
  t.end();
});
