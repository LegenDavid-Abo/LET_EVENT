export interface Country {
  iso2: string;
  name: string;
  dial: string;
}

// ISO 3166-1 alpha-2 code, common name, and calling code.
export const countries: Country[] = [
  { iso2: "NG", name: "Nigeria", dial: "234" },
  { iso2: "US", name: "United States", dial: "1" },
  { iso2: "GB", name: "United Kingdom", dial: "44" },
  { iso2: "CA", name: "Canada", dial: "1" },
  { iso2: "GH", name: "Ghana", dial: "233" },
  { iso2: "KE", name: "Kenya", dial: "254" },
  { iso2: "ZA", name: "South Africa", dial: "27" },
  { iso2: "EG", name: "Egypt", dial: "20" },
  { iso2: "MA", name: "Morocco", dial: "212" },
  { iso2: "DZ", name: "Algeria", dial: "213" },
  { iso2: "TN", name: "Tunisia", dial: "216" },
  { iso2: "ET", name: "Ethiopia", dial: "251" },
  { iso2: "TZ", name: "Tanzania", dial: "255" },
  { iso2: "UG", name: "Uganda", dial: "256" },
  { iso2: "RW", name: "Rwanda", dial: "250" },
  { iso2: "SN", name: "Senegal", dial: "221" },
  { iso2: "CI", name: "Ivory Coast", dial: "225" },
  { iso2: "CM", name: "Cameroon", dial: "237" },
  { iso2: "ZM", name: "Zambia", dial: "260" },
  { iso2: "ZW", name: "Zimbabwe", dial: "263" },
  { iso2: "BW", name: "Botswana", dial: "267" },
  { iso2: "NA", name: "Namibia", dial: "264" },
  { iso2: "MZ", name: "Mozambique", dial: "258" },
  { iso2: "AO", name: "Angola", dial: "244" },
  { iso2: "IE", name: "Ireland", dial: "353" },
  { iso2: "FR", name: "France", dial: "33" },
  { iso2: "DE", name: "Germany", dial: "49" },
  { iso2: "ES", name: "Spain", dial: "34" },
  { iso2: "PT", name: "Portugal", dial: "351" },
  { iso2: "IT", name: "Italy", dial: "39" },
  { iso2: "NL", name: "Netherlands", dial: "31" },
  { iso2: "BE", name: "Belgium", dial: "32" },
  { iso2: "CH", name: "Switzerland", dial: "41" },
  { iso2: "AT", name: "Austria", dial: "43" },
  { iso2: "SE", name: "Sweden", dial: "46" },
  { iso2: "NO", name: "Norway", dial: "47" },
  { iso2: "DK", name: "Denmark", dial: "45" },
  { iso2: "FI", name: "Finland", dial: "358" },
  { iso2: "PL", name: "Poland", dial: "48" },
  { iso2: "GR", name: "Greece", dial: "30" },
  { iso2: "TR", name: "Turkey", dial: "90" },
  { iso2: "RU", name: "Russia", dial: "7" },
  { iso2: "UA", name: "Ukraine", dial: "380" },
  { iso2: "CZ", name: "Czechia", dial: "420" },
  { iso2: "RO", name: "Romania", dial: "40" },
  { iso2: "HU", name: "Hungary", dial: "36" },
  { iso2: "IN", name: "India", dial: "91" },
  { iso2: "PK", name: "Pakistan", dial: "92" },
  { iso2: "BD", name: "Bangladesh", dial: "880" },
  { iso2: "CN", name: "China", dial: "86" },
  { iso2: "JP", name: "Japan", dial: "81" },
  { iso2: "KR", name: "South Korea", dial: "82" },
  { iso2: "ID", name: "Indonesia", dial: "62" },
  { iso2: "MY", name: "Malaysia", dial: "60" },
  { iso2: "SG", name: "Singapore", dial: "65" },
  { iso2: "PH", name: "Philippines", dial: "63" },
  { iso2: "TH", name: "Thailand", dial: "66" },
  { iso2: "VN", name: "Vietnam", dial: "84" },
  { iso2: "AE", name: "United Arab Emirates", dial: "971" },
  { iso2: "SA", name: "Saudi Arabia", dial: "966" },
  { iso2: "QA", name: "Qatar", dial: "974" },
  { iso2: "KW", name: "Kuwait", dial: "965" },
  { iso2: "IL", name: "Israel", dial: "972" },
  { iso2: "JO", name: "Jordan", dial: "962" },
  { iso2: "LB", name: "Lebanon", dial: "961" },
  { iso2: "AU", name: "Australia", dial: "61" },
  { iso2: "NZ", name: "New Zealand", dial: "64" },
  { iso2: "BR", name: "Brazil", dial: "55" },
  { iso2: "MX", name: "Mexico", dial: "52" },
  { iso2: "AR", name: "Argentina", dial: "54" },
  { iso2: "CO", name: "Colombia", dial: "57" },
  { iso2: "CL", name: "Chile", dial: "56" },
  { iso2: "PE", name: "Peru", dial: "51" }
];

export function isoToFlag(iso2: string) {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export function findCountry(iso2: string) {
  return countries.find((c) => c.iso2 === iso2);
}
