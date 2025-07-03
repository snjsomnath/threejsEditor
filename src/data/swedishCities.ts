interface SwedishCity {
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  timezone: string;
  zipUrl: string;
  epwFileName: string;
}

// Swedish cities with their Climate.OneBuilding.org URLs (2009-2023 TMYx data)
export const swedishCities: SwedishCity[] = [
  {
    city: 'Stockholm',
    region: 'Stockholm',
    latitude: 59.3293,
    longitude: 18.0686,
    timezone: 'Europe/Stockholm',
    zipUrl: 'https://climate.onebuilding.org/WMO_Region_6_Europe/SWE_Sweden/ST_Stockholm/SWE_ST_Stockholm.024850_TMYx.2009-2023.zip',
    epwFileName: 'SWE_ST_Stockholm.024850_TMYx.2009-2023.epw'
  },
  {
    city: 'Gothenburg',
    region: 'Västra Götaland',
    latitude: 57.66300,
    longitude: 12.28000,
    timezone: 'Europe/Stockholm',
    zipUrl: 'https://climate.onebuilding.org/WMO_Region_6_Europe/SWE_Sweden/VG_Vastra_Gotaland/SWE_VG_Goteborg.City.AP.025120_TMYx.2009-2023.zip',
    epwFileName: 'SWE_VG_Goteborg.City.AP.025120_TMYx.2009-2023.epw'
  },
  {
    city: 'Malmö',
    region: 'Skåne',
    latitude: 55.6059,
    longitude: 13.0007,
    timezone: 'Europe/Stockholm',
    zipUrl: 'https://climate.onebuilding.org/WMO_Region_6_Europe/SWE_Sweden/SN_Skane/SWE_SN_Malmo.026350_TMYx.2009-2023.zip',
    epwFileName: 'SWE_SN_Malmo.026350_TMYx.2009-2023.epw'
  },
  {
    city: 'Uppsala',
    region: 'Uppsala',
    latitude: 59.8586,
    longitude: 17.6389,
    timezone: 'Europe/Stockholm',
    zipUrl: 'https://climate.onebuilding.org/WMO_Region_6_Europe/SWE_Sweden/UP_Uppsala/SWE_UP_Uppsala.Univ.024620_TMYx.2009-2023.zip',
    epwFileName: 'SWE_UP_Uppsala.Univ.024620_TMYx.2009-2023.epw'
  },
  {
    city: 'Västerås',
    region: 'Västmanland',
    latitude: 59.6162,
    longitude: 16.5528,
    timezone: 'Europe/Stockholm',
    zipUrl: 'https://climate.onebuilding.org/WMO_Region_6_Europe/SWE_Sweden/VM_Vastmanland/SWE_VM_Stockholm.Vasteras.AP.024460_TMYx.2009-2023.zip',
    epwFileName: 'SWE_VM_Stockholm.Vasteras.AP.024460_TMYx.2009-2023.epw'
  },
  {
    city: 'Örebro',
    region: 'Örebro',
    latitude: 59.2741,
    longitude: 15.2066,
    timezone: 'Europe/Stockholm',
    zipUrl: 'https://climate.onebuilding.org/WMO_Region_6_Europe/SWE_Sweden/OR_Orebro/SWE_OR_Orebro.AP.024320_TMYx.2009-2023.zip',
    epwFileName: 'SWE_OR_Orebro.AP.024320_TMYx.2009-2023.epw'
  },
  {
    city: 'Linköping',
    region: 'Östergötland',
    latitude: 58.4108,
    longitude: 15.6214,
    timezone: 'Europe/Stockholm',
    zipUrl: 'https://climate.onebuilding.org/WMO_Region_6_Europe/SWE_Sweden/OG_Ostergotland/SWE_OG_Linkoping.AP.025625_TMYx.2009-2023.zip',
    epwFileName: 'SWE_OG_Linkoping.AP.025625_TMYx.2009-2023.epw'
  },
  {
    city: 'Helsingborg',
    region: 'Skåne',
    latitude: 56.0465,
    longitude: 12.6945,
    timezone: 'Europe/Stockholm',
    zipUrl: 'https://climate.onebuilding.org/WMO_Region_6_Europe/SWE_Sweden/SN_Skane/SWE_SN_Helsingborg.026110_TMYx.2009-2023.zip',
    epwFileName: 'SWE_SN_Helsingborg.026110_TMYx.2009-2023.epw'
  },
  {
    city: 'Jönköping',
    region: 'Jönköping',
    latitude: 57.7826,
    longitude: 14.1618,
    timezone: 'Europe/Stockholm',
    zipUrl: 'https://climate.onebuilding.org/WMO_Region_6_Europe/SWE_Sweden/JO_Jonkoping/SWE_JO_Jonkoping.AP.025500_TMYx.2009-2023.zip',
    epwFileName: 'SWE_JO_Jonkoping.AP.025500_TMYx.2009-2023.epw'
  },
  {
    city: 'Norrköping',
    region: 'Östergötland',
    latitude: 58.5877,
    longitude: 16.1924,
    timezone: 'Europe/Stockholm',
    zipUrl: 'https://climate.onebuilding.org/WMO_Region_6_Europe/SWE_Sweden/OG_Ostergotland/SWE_OG_Norrkoping.AP.025710_TMYx.2009-2023.zip',
    epwFileName: 'SWE_OG_Norrkoping.AP.025710_TMYx.2009-2023.epw'
  },
  {
    city: 'Lund',
    region: 'Skåne',
    latitude: 55.7047,
    longitude: 13.1910,
    timezone: 'Europe/Stockholm',
    zipUrl: 'https://climate.onebuilding.org/WMO_Region_6_Europe/SWE_Sweden/SN_Skane/SWE_SN_Lund.Sol.026330_TMYx.2009-2023.zip',
    epwFileName: 'SWE_SN_Lund.Sol.026330_TMYx.2009-2023.epw'
  },
  {
    city: 'Umeå',
    region: 'Västerbotten',
    latitude: 63.8258,
    longitude: 20.2630,
    timezone: 'Europe/Stockholm',
    zipUrl: 'https://climate.onebuilding.org/WMO_Region_6_Europe/SWE_Sweden/VB_Vasterbotten/SWE_VB_Umea.AP.022860_TMYx.2009-2023.zip',
    epwFileName: 'SWE_VB_Umea.AP.022860_TMYx.2009-2023.epw'
  },
  {
    city: 'Gävle',
    region: 'Gävleborg',
    latitude: 60.6749,
    longitude: 17.1413,
    timezone: 'Europe/Stockholm',
    zipUrl: 'https://climate.onebuilding.org/WMO_Region_6_Europe/SWE_Sweden/GV_Gavleborg/SWE_GV_Gavle.024530_TMYx.2009-2023.zip',
    epwFileName: 'SWE_GV_Gavle.024530_TMYx.2009-2023.epw'
  },
  {
    city: 'Borås',
    region: 'Västra Götaland',
    latitude: 57.7210,
    longitude: 12.9401,
    timezone: 'Europe/Stockholm',
    zipUrl: 'https://climate.onebuilding.org/WMO_Region_6_Europe/SWE_Sweden/VG_Vastra_Gotaland/SWE_VG_Dalsjofors.025361_TMYx.2009-2023.zip',
    epwFileName: 'SWE_VG_Dalsjofors.025361_TMYx.2009-2023.epw'
  },
  {
    city: 'Sundsvall',
    region: 'Västernorrland',
    latitude: 62.3908,
    longitude: 17.3069,
    timezone: 'Europe/Stockholm',
    zipUrl: 'https://climate.onebuilding.org/WMO_Region_6_Europe/SWE_Sweden/VN_Vasternorrland/SWE_VN_Harnosand-Sundsvall.Timra.AP.023660_TMYx.2009-2023.zip',
    epwFileName: 'SWE_VN_Harnosand-Sundsvall.Timra.AP.023660_TMYx.2009-2023.epw'
  },
  {
    city: 'Kiruna',
    region: 'Norrbotten',
    latitude: 67.8558,
    longitude: 20.2253,
    timezone: 'Europe/Stockholm',
    zipUrl: 'https://climate.onebuilding.org/WMO_Region_6_Europe/SWE_Sweden/NB_Norrbotten/SWE_NB_Kiruna.AP.020440_TMYx.2009-2023.zip',
    epwFileName: 'SWE_NB_Kiruna.AP.020440_TMYx.2009-2023.epw'
  }
];

export type { SwedishCity };
