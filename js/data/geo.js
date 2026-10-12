// Countries grouped by continent for the "Countries & Continents" game.
// Each list runs roughly from best-known to least-known. Easy deals only use the first `easy`
// countries, Normal uses a bit more, Hard uses the whole list.
// Transcontinental countries (Russia, Turkey, Egypt, Kazakhstan, Georgia, Armenia, Azerbaijan,
// Cyprus) are left out on purpose so every card has exactly one right answer.
(function () {
  const S = (globalThis.Sol = globalThis.Sol || {});

  S.GEO = [
    {
      name: 'Europe', color: '#3f6fd8', easy: 16,
      countries: [
        'France', 'Germany', 'Italy', 'Spain', 'United Kingdom', 'Portugal', 'Greece', 'Netherlands',
        'Sweden', 'Norway', 'Poland', 'Switzerland', 'Ireland', 'Belgium', 'Austria', 'Denmark',
        'Finland', 'Iceland', 'Ukraine', 'Hungary', 'Croatia', 'Czechia', 'Romania', 'Bulgaria',
        'Serbia', 'Slovakia', 'Slovenia', 'Estonia', 'Latvia', 'Lithuania', 'Belarus', 'Moldova',
        'Albania', 'North Macedonia', 'Montenegro', 'Bosnia & Herzegovina', 'Luxembourg', 'Malta',
        'Monaco', 'Andorra', 'San Marino', 'Liechtenstein', 'Vatican City', 'Türkiye', 'Russia',
      ],
    },
    {
      name: 'Asia', color: '#d9a21b', easy: 16,
      countries: [
        'China', 'Japan', 'India', 'South Korea', 'Thailand', 'Vietnam', 'Indonesia', 'Philippines',
        'Saudi Arabia', 'United Arab Emirates', 'Pakistan', 'Iran', 'Iraq', 'Israel', 'Malaysia',
        'Singapore', 'Nepal', 'Mongolia', 'North Korea', 'Bangladesh', 'Afghanistan', 'Sri Lanka',
        'Qatar', 'Jordan', 'Lebanon', 'Syria', 'Cambodia', 'Laos', 'Myanmar', 'Kuwait', 'Oman',
        'Yemen', 'Bahrain', 'Bhutan', 'Maldives', 'Brunei', 'Uzbekistan', 'Kyrgyzstan', 'Tajikistan',
        'Turkmenistan', 'Timor-Leste', 'Türkiye', 'Russia', 'Kazakhstan', 'Egypt',
      ],
    },
    {
      name: 'Africa', color: '#e0702e', easy: 12,
      countries: [
        'Nigeria', 'Kenya', 'South Africa', 'Morocco', 'Ethiopia', 'Ghana', 'Algeria', 'Tunisia',
        'Senegal', 'Madagascar', 'Tanzania', 'Uganda', 'Cameroon', 'Zimbabwe', 'Angola', 'Somalia',
        'Sudan', 'Libya', 'Rwanda', 'Ivory Coast', 'Mali', 'Namibia', 'Botswana', 'Zambia',
        'Mozambique', 'DR Congo', 'Niger', 'Chad', 'Mauritania', 'Gabon', 'Liberia', 'Sierra Leone',
        'Guinea', 'Burkina Faso', 'Benin', 'Togo', 'Malawi', 'Eritrea', 'Djibouti', 'Burundi',
        'South Sudan', 'Lesotho', 'Eswatini', 'Mauritius', 'Seychelles', 'Cape Verde', 'Gambia',
      ],
    },
    {
      name: 'North America', color: '#d6453d', easy: 11,
      countries: [
        'United States', 'Canada', 'Mexico', 'Cuba', 'Jamaica', 'Panama', 'Costa Rica', 'Guatemala',
        'Honduras', 'Haiti', 'Bahamas', 'Dominican Republic', 'El Salvador', 'Nicaragua', 'Belize',
        'Barbados', 'Trinidad & Tobago', 'Grenada', 'Saint Lucia', 'Dominica', 'Antigua & Barbuda',
        'St Kitts & Nevis',
      ],
    },
    {
      name: 'South America', color: '#3fa65a', easy: 10,
      countries: [
        'Brazil', 'Argentina', 'Chile', 'Peru', 'Colombia', 'Venezuela', 'Uruguay', 'Ecuador',
        'Bolivia', 'Paraguay', 'Guyana', 'Suriname',
      ],
    },
    {
      name: 'Oceania', color: '#22a3a3', easy: 7,
      countries: [
        'Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'Samoa', 'Tonga', 'Vanuatu',
        'Solomon Islands', 'Kiribati', 'Micronesia', 'Palau', 'Marshall Islands', 'Tuvalu', 'Nauru',
      ],
    },
  ];
})();
