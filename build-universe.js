const fs = require('fs');

const dax40 = [
{ symbol: "ADS.DE", name: "Adidas AG", sector: "Consumer Discretionary", market: "DAX40" },
{ symbol: "AIR.DE", name: "Airbus SE", sector: "Industrials", market: "DAX40" },
{ symbol: "ALV.DE", name: "Allianz SE", sector: "Financials", market: "DAX40" },
{ symbol: "BAS.DE", name: "BASF SE", sector: "Materials", market: "DAX40" },
{ symbol: "BAYN.DE", name: "Bayer AG", sector: "Healthcare", market: "DAX40" },
{ symbol: "BEI.DE", name: "Beiersdorf AG", sector: "Consumer Staples", market: "DAX40" },
{ symbol: "BMW.DE", name: "BMW AG", sector: "Consumer Discretionary", market: "DAX40" },
{ symbol: "BNR.DE", name: "Brenntag SE", sector: "Industrials", market: "DAX40" },
{ symbol: "CBK.DE", name: "Commerzbank AG", sector: "Financials", market: "DAX40" },
{ symbol: "CON.DE", name: "Continental AG", sector: "Consumer Discretionary", market: "DAX40" },
{ symbol: "1COV.DE", name: "Covestro AG", sector: "Materials", market: "DAX40" },
{ symbol: "DTG.DE", name: "Daimler Truck Holding AG", sector: "Industrials", market: "DAX40" },
{ symbol: "DHER.DE", name: "Delivery Hero SE", sector: "Consumer Discretionary", market: "DAX40" },
{ symbol: "DBK.DE", name: "Deutsche Bank AG", sector: "Financials", market: "DAX40" },
{ symbol: "DB1.DE", name: "Deutsche Börse AG", sector: "Financials", market: "DAX40" },
{ symbol: "DHL.DE", name: "DHL Group", sector: "Industrials", market: "DAX40" },
{ symbol: "DTE.DE", name: "Deutsche Telekom AG", sector: "Communication Services", market: "DAX40" },
{ symbol: "EOAN.DE", name: "E.ON SE", sector: "Utilities", market: "DAX40" },
{ symbol: "FME.DE", name: "Fresenius Medical Care", sector: "Healthcare", market: "DAX40" },
{ symbol: "FRE.DE", name: "Fresenius SE", sector: "Healthcare", market: "DAX40" },
{ symbol: "HNR1.DE", name: "Hannover Rück SE", sector: "Financials", market: "DAX40" },
{ symbol: "HEI.DE", name: "Heidelberg Materials AG", sector: "Materials", market: "DAX40" },
{ symbol: "HFG.DE", name: "HelloFresh SE", sector: "Consumer Discretionary", market: "DAX40" },
{ symbol: "HEN3.DE", name: "Henkel AG", sector: "Consumer Staples", market: "DAX40" },
{ symbol: "IFX.DE", name: "Infineon Technologies AG", sector: "Technology", market: "DAX40" },
{ symbol: "MBG.DE", name: "Mercedes-Benz Group AG", sector: "Consumer Discretionary", market: "DAX40" },
{ symbol: "MRK.DE", name: "Merck KGaA", sector: "Healthcare", market: "DAX40" },
{ symbol: "MTX.DE", name: "MTU Aero Engines AG", sector: "Industrials", market: "DAX40" },
{ symbol: "MUV2.DE", name: "Münchener Rück", sector: "Financials", market: "DAX40" },
{ symbol: "P911.DE", name: "Porsche AG", sector: "Consumer Discretionary", market: "DAX40" },
{ symbol: "PAH3.DE", name: "Porsche Automobil Holding SE", sector: "Consumer Discretionary", market: "DAX40" },
{ symbol: "PUM.DE", name: "Puma SE", sector: "Consumer Discretionary", market: "DAX40" },
{ symbol: "QIA.DE", name: "Qiagen N.V.", sector: "Healthcare", market: "DAX40" },
{ symbol: "RHM.DE", name: "Rheinmetall AG", sector: "Industrials", market: "DAX40" },
{ symbol: "RWE.DE", name: "RWE AG", sector: "Utilities", market: "DAX40" },
{ symbol: "SAP.DE", name: "SAP SE", sector: "Technology", market: "DAX40" },
{ symbol: "SRT3.DE", name: "Sartorius AG", sector: "Healthcare", market: "DAX40" },
{ symbol: "SIE.DE", name: "Siemens AG", sector: "Industrials", market: "DAX40" },
{ symbol: "ENR.DE", name: "Siemens Energy AG", sector: "Industrials", market: "DAX40" },
{ symbol: "VNA.DE", name: "Vonovia SE", sector: "Real Estate", market: "DAX40" }
];

const eurostoxx50 = [
{ symbol: "ADS.DE", name: "Adidas AG", sector: "Consumer Discretionary", market: "EUROSTOXX50" },
{ symbol: "ADYEN.AS", name: "Adyen N.V.", sector: "Financials", market: "EUROSTOXX50" },
{ symbol: "AD.AS", name: "Ahold Delhaize", sector: "Consumer Staples", market: "EUROSTOXX50" },
{ symbol: "AI.PA", name: "Air Liquide", sector: "Materials", market: "EUROSTOXX50" },
{ symbol: "AIR.PA", name: "Airbus SE", sector: "Industrials", market: "EUROSTOXX50" },
{ symbol: "ALV.DE", name: "Allianz SE", sector: "Financials", market: "EUROSTOXX50" },
{ symbol: "ARGX.BR", name: "Argenx SE", sector: "Healthcare", market: "EUROSTOXX50" },
{ symbol: "ASML.AS", name: "ASML Holding", sector: "Technology", market: "EUROSTOXX50" },
{ symbol: "CS.PA", name: "AXA SA", sector: "Financials", market: "EUROSTOXX50" },
{ symbol: "BAS.DE", name: "BASF SE", sector: "Materials", market: "EUROSTOXX50" },
{ symbol: "BAYN.DE", name: "Bayer AG", sector: "Healthcare", market: "EUROSTOXX50" },
{ symbol: "BBVA.MC", name: "BBVA", sector: "Financials", market: "EUROSTOXX50" },
{ symbol: "SAN.MC", name: "Banco Santander", sector: "Financials", market: "EUROSTOXX50" },
{ symbol: "BMW.DE", name: "BMW AG", sector: "Consumer Discretionary", market: "EUROSTOXX50" },
{ symbol: "BNP.PA", name: "BNP Paribas", sector: "Financials", market: "EUROSTOXX50" },
{ symbol: "BN.PA", name: "Danone", sector: "Consumer Staples", market: "EUROSTOXX50" },
{ symbol: "DB1.DE", name: "Deutsche Börse AG", sector: "Financials", market: "EUROSTOXX50" },
{ symbol: "DHL.DE", name: "DHL Group", sector: "Industrials", market: "EUROSTOXX50" },
{ symbol: "DTE.DE", name: "Deutsche Telekom AG", sector: "Communication Services", market: "EUROSTOXX50" },
{ symbol: "ENEL.MI", name: "Enel SpA", sector: "Utilities", market: "EUROSTOXX50" },
{ symbol: "ENI.MI", name: "Eni SpA", sector: "Energy", market: "EUROSTOXX50" },
{ symbol: "ENR.DE", name: "Siemens Energy AG", sector: "Industrials", market: "EUROSTOXX50" },
{ symbol: "EL.PA", name: "EssilorLuxottica", sector: "Healthcare", market: "EUROSTOXX50" },
{ symbol: "RACE.MI", name: "Ferrari N.V.", sector: "Consumer Discretionary", market: "EUROSTOXX50" },
{ symbol: "RMS.PA", name: "Hermès International", sector: "Consumer Discretionary", market: "EUROSTOXX50" },
{ symbol: "IBE.MC", name: "Iberdrola SA", sector: "Utilities", market: "EUROSTOXX50" },
{ symbol: "IFX.DE", name: "Infineon Technologies AG", sector: "Technology", market: "EUROSTOXX50" },
{ symbol: "INGA.AS", name: "ING Group", sector: "Financials", market: "EUROSTOXX50" },
{ symbol: "ITX.MC", name: "Inditex", sector: "Consumer Discretionary", market: "EUROSTOXX50" },
{ symbol: "ISP.MI", name: "Intesa Sanpaolo", sector: "Financials", market: "EUROSTOXX50" },
{ symbol: "KER.PA", name: "Kering", sector: "Consumer Discretionary", market: "EUROSTOXX50" },
{ symbol: "OR.PA", name: "L'Oréal", sector: "Consumer Staples", market: "EUROSTOXX50" },
{ symbol: "MC.PA", name: "LVMH", sector: "Consumer Discretionary", market: "EUROSTOXX50" },
{ symbol: "MBG.DE", name: "Mercedes-Benz Group AG", sector: "Consumer Discretionary", market: "EUROSTOXX50" },
{ symbol: "MUV2.DE", name: "Münchener Rück", sector: "Financials", market: "EUROSTOXX50" },
{ symbol: "NDA-FI.HE", name: "Nordea Bank", sector: "Financials", market: "EUROSTOXX50" },
{ symbol: "PRX.AS", name: "Prosus N.V.", sector: "Consumer Discretionary", market: "EUROSTOXX50" },
{ symbol: "RHM.DE", name: "Rheinmetall AG", sector: "Industrials", market: "EUROSTOXX50" },
{ symbol: "SAF.PA", name: "Safran", sector: "Industrials", market: "EUROSTOXX50" },
{ symbol: "SGO.PA", name: "Saint-Gobain", sector: "Industrials", market: "EUROSTOXX50" },
{ symbol: "SAN.PA", name: "Sanofi", sector: "Healthcare", market: "EUROSTOXX50" },
{ symbol: "SAP.DE", name: "SAP SE", sector: "Technology", market: "EUROSTOXX50" },
{ symbol: "SU.PA", name: "Schneider Electric", sector: "Industrials", market: "EUROSTOXX50" },
{ symbol: "SIE.DE", name: "Siemens AG", sector: "Industrials", market: "EUROSTOXX50" },
{ symbol: "ABI.BR", name: "Anheuser-Busch InBev", sector: "Consumer Staples", market: "EUROSTOXX50" },
{ symbol: "TTE.PA", name: "TotalEnergies", sector: "Energy", market: "EUROSTOXX50" },
{ symbol: "UCG.MI", name: "UniCredit", sector: "Financials", market: "EUROSTOXX50" },
{ symbol: "DG.PA", name: "Vinci SA", sector: "Industrials", market: "EUROSTOXX50" },
{ symbol: "VOW3.DE", name: "Volkswagen AG", sector: "Consumer Discretionary", market: "EUROSTOXX50" },
{ symbol: "WKL.AS", name: "Wolters Kluwer", sector: "Industrials", market: "EUROSTOXX50" }
];

const ftse100 = [
{ symbol: "AAL.L", name: "Anglo American", sector: "Materials", market: "FTSE100" },
{ symbol: "ABF.L", name: "Associated British Foods", sector: "Consumer Staples", market: "FTSE100" },
{ symbol: "ADM.L", name: "Admiral Group", sector: "Financials", market: "FTSE100" },
{ symbol: "AHT.L", name: "Ashtead Group", sector: "Industrials", market: "FTSE100" },
{ symbol: "ANTO.L", name: "Antofagasta", sector: "Materials", market: "FTSE100" },
{ symbol: "AUTO.L", name: "Auto Trader Group", sector: "Technology", market: "FTSE100" },
{ symbol: "AV.L", name: "Aviva", sector: "Financials", market: "FTSE100" },
{ symbol: "AZN.L", name: "AstraZeneca", sector: "Healthcare", market: "FTSE100" },
{ symbol: "BA.L", name: "BAE Systems", sector: "Industrials", market: "FTSE100" },
{ symbol: "BARC.L", name: "Barclays", sector: "Financials", market: "FTSE100" },
{ symbol: "BATS.L", name: "British American Tobacco", sector: "Consumer Staples", market: "FTSE100" },
{ symbol: "BDEV.L", name: "Barratt Developments", sector: "Consumer Discretionary", market: "FTSE100" },
{ symbol: "BHP.L", name: "BHP Group", sector: "Materials", market: "FTSE100" },
{ symbol: "BKG.L", name: "Berkeley Group", sector: "Consumer Discretionary", market: "FTSE100" },
{ symbol: "BME.L", name: "B&M European Value Retail", sector: "Consumer Discretionary", market: "FTSE100" },
{ symbol: "BNZL.L", name: "Bunzl", sector: "Industrials", market: "FTSE100" },
{ symbol: "BP.L", name: "BP", sector: "Energy", market: "FTSE100" },
{ symbol: "BRBY.L", name: "Burberry Group", sector: "Consumer Discretionary", market: "FTSE100" },
{ symbol: "BT-A.L", name: "BT Group", sector: "Communication Services", market: "FTSE100" },
{ symbol: "CCEP.L", name: "Coca-Cola Europacific Partners", sector: "Consumer Staples", market: "FTSE100" },
{ symbol: "CNA.L", name: "Centrica", sector: "Utilities", market: "FTSE100" },
{ symbol: "CPG.L", name: "Compass Group", sector: "Consumer Discretionary", market: "FTSE100" },
{ symbol: "CRDA.L", name: "Croda International", sector: "Materials", market: "FTSE100" },
{ symbol: "CRH.L", name: "CRH plc", sector: "Materials", market: "FTSE100" },
{ symbol: "CTEC.L", name: "ConvaTec Group", sector: "Healthcare", market: "FTSE100" },
{ symbol: "DCC.L", name: "DCC plc", sector: "Industrials", market: "FTSE100" },
{ symbol: "DGE.L", name: "Diageo", sector: "Consumer Staples", market: "FTSE100" },
{ symbol: "DARK.L", name: "Darktrace", sector: "Technology", market: "FTSE100" },
{ symbol: "EDV.L", name: "Endeavour Mining", sector: "Materials", market: "FTSE100" },
{ symbol: "ENT.L", name: "Entain", sector: "Consumer Discretionary", market: "FTSE100" },
{ symbol: "EXPN.L", name: "Experian", sector: "Industrials", market: "FTSE100" },
{ symbol: "EZJ.L", name: "easyJet", sector: "Industrials", market: "FTSE100" },
{ symbol: "FERG.L", name: "Ferguson Enterprises", sector: "Industrials", market: "FTSE100" },
{ symbol: "FRES.L", name: "Fresnillo", sector: "Materials", market: "FTSE100" },
{ symbol: "GLEN.L", name: "Glencore", sector: "Materials", market: "FTSE100" },
{ symbol: "GSK.L", name: "GSK plc", sector: "Healthcare", market: "FTSE100" },
{ symbol: "HIK.L", name: "Hikma Pharmaceuticals", sector: "Healthcare", market: "FTSE100" },
{ symbol: "HLN.L", name: "Haleon", sector: "Consumer Staples", market: "FTSE100" },
{ symbol: "HSBA.L", name: "HSBC Holdings", sector: "Financials", market: "FTSE100" },
{ symbol: "HWDN.L", name: "Howden Joinery", sector: "Industrials", market: "FTSE100" },
{ symbol: "IAG.L", name: "International Consolidated Airlines Group", sector: "Industrials", market: "FTSE100" },
{ symbol: "ICG.L", name: "Intermediate Capital Group", sector: "Financials", market: "FTSE100" },
{ symbol: "IGG.L", name: "IG Group", sector: "Financials", market: "FTSE100" },
{ symbol: "IHG.L", name: "InterContinental Hotels Group", sector: "Consumer Discretionary", market: "FTSE100" },
{ symbol: "III.L", name: "3i Group", sector: "Financials", market: "FTSE100" },
{ symbol: "IMB.L", name: "Imperial Brands", sector: "Consumer Staples", market: "FTSE100" },
{ symbol: "IMI.L", name: "IMI plc", sector: "Industrials", market: "FTSE100" },
{ symbol: "INF.L", name: "Informa", sector: "Communication Services", market: "FTSE100" },
{ symbol: "ITRK.L", name: "Intertek Group", sector: "Industrials", market: "FTSE100" },
{ symbol: "JD.L", name: "JD Sports Fashion", sector: "Consumer Discretionary", market: "FTSE100" },
{ symbol: "KGF.L", name: "Kingfisher", sector: "Consumer Discretionary", market: "FTSE100" },
{ symbol: "LAND.L", name: "Land Securities Group", sector: "Real Estate", market: "FTSE100" },
{ symbol: "LGEN.L", name: "Legal & General Group", sector: "Financials", market: "FTSE100" },
{ symbol: "LLOY.L", name: "Lloyds Banking Group", sector: "Financials", market: "FTSE100" },
{ symbol: "LSEG.L", name: "London Stock Exchange Group", sector: "Financials", market: "FTSE100" },
{ symbol: "MKS.L", name: "Marks & Spencer Group", sector: "Consumer Discretionary", market: "FTSE100" },
{ symbol: "MNDI.L", name: "Mondi", sector: "Materials", market: "FTSE100" },
{ symbol: "MNG.L", name: "M&G plc", sector: "Financials", market: "FTSE100" },
{ symbol: "MRO.L", name: "Melrose Industries", sector: "Industrials", market: "FTSE100" },
{ symbol: "NG.L", name: "National Grid", sector: "Utilities", market: "FTSE100" },
{ symbol: "NWG.L", name: "NatWest Group", sector: "Financials", market: "FTSE100" },
{ symbol: "NXT.L", name: "Next plc", sector: "Consumer Discretionary", market: "FTSE100" },
{ symbol: "PHNX.L", name: "Phoenix Group", sector: "Financials", market: "FTSE100" },
{ symbol: "PRU.L", name: "Prudential plc", sector: "Financials", market: "FTSE100" },
{ symbol: "PSH.L", name: "Pershing Square Holdings", sector: "Financials", market: "FTSE100" },
{ symbol: "PSN.L", name: "Persimmon", sector: "Consumer Discretionary", market: "FTSE100" },
{ symbol: "PSON.L", name: "Pearson", sector: "Communication Services", market: "FTSE100" },
{ symbol: "REL.L", name: "RELX", sector: "Industrials", market: "FTSE100" },
{ symbol: "RIO.L", name: "Rio Tinto", sector: "Materials", market: "FTSE100" },
{ symbol: "RKT.L", name: "Reckitt Benckiser", sector: "Consumer Staples", market: "FTSE100" },
{ symbol: "RMV.L", name: "Rightmove", sector: "Communication Services", market: "FTSE100" },
{ symbol: "RR.L", name: "Rolls-Royce Holdings", sector: "Industrials", market: "FTSE100" },
{ symbol: "RTO.L", name: "Rentokil Initial", sector: "Industrials", market: "FTSE100" },
{ symbol: "SBRY.L", name: "Sainsbury's", sector: "Consumer Staples", market: "FTSE100" },
{ symbol: "SDR.L", name: "Schroders", sector: "Financials", market: "FTSE100" },
{ symbol: "SGE.L", name: "Sage Group", sector: "Technology", market: "FTSE100" },
{ symbol: "SGRO.L", name: "Segro", sector: "Real Estate", market: "FTSE100" },
{ symbol: "SHEL.L", name: "Shell", sector: "Energy", market: "FTSE100" },
{ symbol: "SKG.L", name: "Smurfit Kappa Group", sector: "Materials", market: "FTSE100" },
{ symbol: "SMIN.L", name: "Smiths Group", sector: "Industrials", market: "FTSE100" },
{ symbol: "SMT.L", name: "Scottish Mortgage Investment Trust", sector: "Financials", market: "FTSE100" },
{ symbol: "SN.L", name: "Smith & Nephew", sector: "Healthcare", market: "FTSE100" },
{ symbol: "SPX.L", name: "Spirax Group", sector: "Industrials", market: "FTSE100" },
{ symbol: "SSE.L", name: "SSE plc", sector: "Utilities", market: "FTSE100" },
{ symbol: "STAN.L", name: "Standard Chartered", sector: "Financials", market: "FTSE100" },
{ symbol: "SVT.L", name: "Severn Trent", sector: "Utilities", market: "FTSE100" },
{ symbol: "TSCO.L", name: "Tesco", sector: "Consumer Staples", market: "FTSE100" },
{ symbol: "TW.L", name: "Taylor Wimpey", sector: "Consumer Discretionary", market: "FTSE100" },
{ symbol: "ULVR.L", name: "Unilever", sector: "Consumer Staples", market: "FTSE100" },
{ symbol: "UTG.L", name: "Unite Group", sector: "Real Estate", market: "FTSE100" },
{ symbol: "UU.L", name: "United Utilities", sector: "Utilities", market: "FTSE100" },
{ symbol: "VOD.L", name: "Vodafone Group", sector: "Communication Services", market: "FTSE100" },
{ symbol: "WEIR.L", name: "Weir Group", sector: "Industrials", market: "FTSE100" },
{ symbol: "WPP.L", name: "WPP plc", sector: "Communication Services", market: "FTSE100" },
{ symbol: "WTB.L", name: "Whitbread", sector: "Consumer Discretionary", market: "FTSE100" }
];

const aex25 = [
{ symbol: "ABN.AS", name: "ABN AMRO Bank", sector: "Financials", market: "AEX25" },
{ symbol: "ADYEN.AS", name: "Adyen", sector: "Financials", market: "AEX25" },
{ symbol: "AEGN.AS", name: "Aegon", sector: "Financials", market: "AEX25" },
{ symbol: "AD.AS", name: "Ahold Delhaize", sector: "Consumer Staples", market: "AEX25" },
{ symbol: "AKZO.AS", name: "Akzo Nobel", sector: "Materials", market: "AEX25" },
{ symbol: "MT.AS", name: "ArcelorMittal", sector: "Materials", market: "AEX25" },
{ symbol: "ASM.AS", name: "ASM International", sector: "Technology", market: "AEX25" },
{ symbol: "ASML.AS", name: "ASML Holding", sector: "Technology", market: "AEX25" },
{ symbol: "ASRNL.AS", name: "ASR Nederland", sector: "Financials", market: "AEX25" },
{ symbol: "BESI.AS", name: "BE Semiconductor Industries", sector: "Technology", market: "AEX25" },
{ symbol: "CVC.AS", name: "CVC Capital Partners", sector: "Financials", market: "AEX25" },
{ symbol: "DSFIR.AS", name: "DSM-Firmenich", sector: "Materials", market: "AEX25" },
{ symbol: "EXOR.AS", name: "Exor N.V.", sector: "Financials", market: "AEX25" },
{ symbol: "HEIA.AS", name: "Heineken", sector: "Consumer Staples", market: "AEX25" },
{ symbol: "IMCD.AS", name: "IMCD", sector: "Industrials", market: "AEX25" },
{ symbol: "INGA.AS", name: "ING Groep", sector: "Financials", market: "AEX25" },
{ symbol: "INPST.AS", name: "InPost", sector: "Industrials", market: "AEX25" },
{ symbol: "KPN.AS", name: "KPN", sector: "Communication Services", market: "AEX25" },
{ symbol: "NN.AS", name: "NN Group", sector: "Financials", market: "AEX25" },
{ symbol: "PHIA.AS", name: "Koninklijke Philips", sector: "Healthcare", market: "AEX25" },
{ symbol: "PRX.AS", name: "Prosus", sector: "Consumer Discretionary", market: "AEX25" },
{ symbol: "REN.AS", name: "RELX", sector: "Industrials", market: "AEX25" },
{ symbol: "SBMO.AS", name: "SBM Offshore", sector: "Energy", market: "AEX25" },
{ symbol: "SHELL.AS", name: "Shell", sector: "Energy", market: "AEX25" },
{ symbol: "UMG.AS", name: "Universal Music Group", sector: "Communication Services", market: "AEX25" },
{ symbol: "UNA.AS", name: "Unilever", sector: "Consumer Staples", market: "AEX25" },
{ symbol: "WDP.AS", name: "WDP", sector: "Real Estate", market: "AEX25" },
{ symbol: "WKL.AS", name: "Wolters Kluwer", sector: "Industrials", market: "AEX25" }
];

const ibex35 = [
{ symbol: "ANA.MC", name: "Acciona", sector: "Industrials", market: "IBEX35" },
{ symbol: "ANE.MC", name: "Acciona Energía", sector: "Utilities", market: "IBEX35" },
{ symbol: "ACX.MC", name: "Acerinox", sector: "Materials", market: "IBEX35" },
{ symbol: "ACS.MC", name: "ACS Group", sector: "Industrials", market: "IBEX35" },
{ symbol: "AENA.MC", name: "Aena", sector: "Industrials", market: "IBEX35" },
{ symbol: "AMS.MC", name: "Amadeus IT Group", sector: "Technology", market: "IBEX35" },
{ symbol: "MTS.MC", name: "ArcelorMittal", sector: "Materials", market: "IBEX35" },
{ symbol: "SAB.MC", name: "Banco de Sabadell", sector: "Financials", market: "IBEX35" },
{ symbol: "SAN.MC", name: "Banco Santander", sector: "Financials", market: "IBEX35" },
{ symbol: "BKT.MC", name: "Bankinter", sector: "Financials", market: "IBEX35" },
{ symbol: "BBVA.MC", name: "BBVA", sector: "Financials", market: "IBEX35" },
{ symbol: "CABK.MC", name: "CaixaBank", sector: "Financials", market: "IBEX35" },
{ symbol: "CLNX.MC", name: "Cellnex Telecom", sector: "Communication Services", market: "IBEX35" },
{ symbol: "COL.MC", name: "Inmobiliaria Colonial", sector: "Real Estate", market: "IBEX35" },
{ symbol: "ENG.MC", name: "Enagás", sector: "Utilities", market: "IBEX35" },
{ symbol: "ELE.MC", name: "Endesa", sector: "Utilities", market: "IBEX35" },
{ symbol: "FER.MC", name: "Ferrovial", sector: "Industrials", market: "IBEX35" },
{ symbol: "FDR.MC", name: "Fluidra", sector: "Industrials", market: "IBEX35" },
{ symbol: "GRF.MC", name: "Grifols", sector: "Healthcare", market: "IBEX35" },
{ symbol: "IAG.MC", name: "IAG", sector: "Industrials", market: "IBEX35" },
{ symbol: "IBE.MC", name: "Iberdrola", sector: "Utilities", market: "IBEX35" },
{ symbol: "ITX.MC", name: "Inditex", sector: "Consumer Discretionary", market: "IBEX35" },
{ symbol: "IDR.MC", name: "Indra Sistemas", sector: "Technology", market: "IBEX35" },
{ symbol: "MAP.MC", name: "Mapfre", sector: "Financials", market: "IBEX35" },
{ symbol: "MEL.MC", name: "Meliá Hotels International", sector: "Consumer Discretionary", market: "IBEX35" },
{ symbol: "MRL.MC", name: "Merlin Properties", sector: "Real Estate", market: "IBEX35" },
{ symbol: "NTGY.MC", name: "Naturgy Energy Group", sector: "Utilities", market: "IBEX35" },
{ symbol: "RED.MC", name: "Redeia", sector: "Utilities", market: "IBEX35" },
{ symbol: "REP.MC", name: "Repsol", sector: "Energy", market: "IBEX35" },
{ symbol: "ROVI.MC", name: "Laboratorios Rovi", sector: "Healthcare", market: "IBEX35" },
{ symbol: "SCYR.MC", name: "Sacyr", sector: "Industrials", market: "IBEX35" },
{ symbol: "SLR.MC", name: "Solaria Energía", sector: "Utilities", market: "IBEX35" },
{ symbol: "TEF.MC", name: "Telefónica", sector: "Communication Services", market: "IBEX35" },
{ symbol: "UNI.MC", name: "Unicaja Banco", sector: "Financials", market: "IBEX35" },
{ symbol: "LOG.MC", name: "Logista", sector: "Industrials", market: "IBEX35" }
];

const smi20 = [
{ symbol: "ABBN.SW", name: "ABB Ltd", sector: "Industrials", market: "SMI20" },
{ symbol: "ALC.SW", name: "Alcon Inc.", sector: "Healthcare", market: "SMI20" },
{ symbol: "CFR.SW", name: "Compagnie Financière Richemont", sector: "Consumer Discretionary", market: "SMI20" },
{ symbol: "GEBN.SW", name: "Geberit AG", sector: "Industrials", market: "SMI20" },
{ symbol: "GIVN.SW", name: "Givaudan SA", sector: "Materials", market: "SMI20" },
{ symbol: "HOLN.SW", name: "Holcim Ltd", sector: "Materials", market: "SMI20" },
{ symbol: "KNIN.SW", name: "Kühne + Nagel International", sector: "Industrials", market: "SMI20" },
{ symbol: "LOGN.SW", name: "Logitech International", sector: "Technology", market: "SMI20" },
{ symbol: "LONN.SW", name: "Lonza Group AG", sector: "Healthcare", market: "SMI20" },
{ symbol: "NESN.SW", name: "Nestlé S.A.", sector: "Consumer Staples", market: "SMI20" },
{ symbol: "NOVN.SW", name: "Novartis AG", sector: "Healthcare", market: "SMI20" },
{ symbol: "PGHN.SW", name: "Partners Group", sector: "Financials", market: "SMI20" },
{ symbol: "ROG.SW", name: "Roche Holding AG", sector: "Healthcare", market: "SMI20" },
{ symbol: "SGSN.SW", name: "SGS SA", sector: "Industrials", market: "SMI20" },
{ symbol: "SIKA.SW", name: "Sika AG", sector: "Materials", market: "SMI20" },
{ symbol: "SLHN.SW", name: "Swiss Life Holding AG", sector: "Financials", market: "SMI20" },
{ symbol: "SREN.SW", name: "Swiss Re AG", sector: "Financials", market: "SMI20" },
{ symbol: "SCMN.SW", name: "Swisscom AG", sector: "Communication Services", market: "SMI20" },
{ symbol: "UBSG.SW", name: "UBS Group AG", sector: "Financials", market: "SMI20" },
{ symbol: "ZURN.SW", name: "Zurich Insurance Group", sector: "Financials", market: "SMI20" }
];

const sp400 = [
{ symbol: "AA", name: "Alcoa Corporation", sector: "Materials", market: "SP400" },
{ symbol: "AAL", name: "American Airlines Group", sector: "Industrials", market: "SP400" },
{ symbol: "AAON", name: "AAON Inc.", sector: "Industrials", market: "SP400" },
{ symbol: "ACI", name: "Albertsons Companies", sector: "Consumer Staples", market: "SP400" },
{ symbol: "ACM", name: "AECOM", sector: "Industrials", market: "SP400" },
{ symbol: "ADC", name: "Agree Realty", sector: "Real Estate", market: "SP400" },
{ symbol: "AEIS", name: "Advanced Energy Industries", sector: "Technology", market: "SP400" },
{ symbol: "AFG", name: "American Financial Group", sector: "Financials", market: "SP400" },
{ symbol: "AGCO", name: "AGCO Corporation", sector: "Industrials", market: "SP400" },
{ symbol: "AHR", name: "American Healthcare REIT", sector: "Real Estate", market: "SP400" },
{ symbol: "AIT", name: "Applied Industrial Technologies", sector: "Industrials", market: "SP400" },
{ symbol: "ALGM", name: "Allegro MicroSystems", sector: "Technology", market: "SP400" },
{ symbol: "ALK", name: "Alaska Air Group", sector: "Industrials", market: "SP400" },
{ symbol: "ALLY", name: "Ally Financial", sector: "Financials", market: "SP400" },
{ symbol: "ALSN", name: "Allison Transmission", sector: "Industrials", market: "SP400" },
{ symbol: "AMH", name: "American Homes 4 Rent", sector: "Real Estate", market: "SP400" },
{ symbol: "AN", name: "AutoNation", sector: "Consumer Discretionary", market: "SP400" },
{ symbol: "APA", name: "APA Corporation", sector: "Energy", market: "SP400" },
{ symbol: "AR", name: "Antero Resources", sector: "Energy", market: "SP400" },
{ symbol: "ATI", name: "ATI Inc.", sector: "Materials", market: "SP400" },
{ symbol: "ATO", name: "Atmos Energy", sector: "Utilities", market: "SP400" },
{ symbol: "AVNT", name: "Avient Corporation", sector: "Materials", market: "SP400" },
{ symbol: "AXS", name: "Axis Capital Holdings", sector: "Financials", market: "SP400" },
{ symbol: "AZEK", name: "AZEK Company", sector: "Industrials", market: "SP400" },
{ symbol: "BC", name: "Brunswick Corporation", sector: "Consumer Discretionary", market: "SP400" },
{ symbol: "BJ", name: "BJ's Wholesale Club", sector: "Consumer Staples", market: "SP400" },
{ symbol: "BLD", name: "TopBuild Corp.", sector: "Industrials", market: "SP400" },
{ symbol: "BWXT", name: "BWX Technologies", sector: "Industrials", market: "SP400" },
{ symbol: "CASY", name: "Casey's General Stores", sector: "Consumer Staples", market: "SP400" },
{ symbol: "CG", name: "Carlyle Group", sector: "Financials", market: "SP400" },
{ symbol: "CHE", name: "Chemed Corporation", sector: "Healthcare", market: "SP400" },
{ symbol: "CIEN", name: "Ciena Corporation", sector: "Technology", market: "SP400" },
{ symbol: "CLH", name: "Clean Harbors", sector: "Industrials", market: "SP400" },
{ symbol: "COHR", name: "Coherent Corp.", sector: "Technology", market: "SP400" },
{ symbol: "CR", name: "Crane Company", sector: "Industrials", market: "SP400" },
{ symbol: "CRS", name: "Carpenter Technology", sector: "Materials", market: "SP400" },
{ symbol: "CW", name: "Curtiss-Wright", sector: "Industrials", market: "SP400" },
{ symbol: "DCI", name: "Donaldson Company", sector: "Industrials", market: "SP400" },
{ symbol: "DINO", name: "HF Sinclair", sector: "Energy", market: "SP400" },
{ symbol: "DKS", name: "DICK'S Sporting Goods", sector: "Consumer Discretionary", market: "SP400" },
{ symbol: "EGP", name: "EastGroup Properties", sector: "Real Estate", market: "SP400" },
{ symbol: "EHC", name: "Encompass Health", sector: "Healthcare", market: "SP400" },
{ symbol: "ELS", name: "Equity LifeStyle Properties", sector: "Real Estate", market: "SP400" },
{ symbol: "ENPH", name: "Enphase Energy", sector: "Technology", market: "SP400" },
{ symbol: "ENS", name: "EnerSys", sector: "Industrials", market: "SP400" },
{ symbol: "ESI", name: "Element Solutions", sector: "Materials", market: "SP400" },
{ symbol: "EVR", name: "Evercore Inc.", sector: "Financials", market: "SP400" },
{ symbol: "EXP", name: "Eagle Materials", sector: "Materials", market: "SP400" },
{ symbol: "EXPO", name: "Exponent Inc.", sector: "Industrials", market: "SP400" },
{ symbol: "FBIN", name: "Fortune Brands Innovations", sector: "Industrials", market: "SP400" },
{ symbol: "FCN", name: "FTI Consulting", sector: "Industrials", market: "SP400" },
{ symbol: "FHN", name: "First Horizon", sector: "Financials", market: "SP400" },
{ symbol: "FLS", name: "Flowserve", sector: "Industrials", market: "SP400" },
{ symbol: "FNB", name: "F.N.B. Corporation", sector: "Financials", market: "SP400" },
{ symbol: "FNF", name: "Fidelity National Financial", sector: "Financials", market: "SP400" },
{ symbol: "FR", name: "First Industrial Realty Trust", sector: "Real Estate", market: "SP400" },
{ symbol: "G", name: "Genpact", sector: "Technology", market: "SP400" },
{ symbol: "GATX", name: "GATX Corporation", sector: "Industrials", market: "SP400" },
{ symbol: "GBCI", name: "Glacier Bancorp", sector: "Financials", market: "SP400" },
{ symbol: "GFF", name: "Griffon Corporation", sector: "Industrials", market: "SP400" },
{ symbol: "GLPI", name: "Gaming and Leisure Properties", sector: "Real Estate", market: "SP400" },
{ symbol: "GNTX", name: "Gentex Corporation", sector: "Consumer Discretionary", market: "SP400" },
{ symbol: "GWRE", name: "Guidewire Software", sector: "Technology", market: "SP400" },
{ symbol: "HAE", name: "Haemonetics", sector: "Healthcare", market: "SP400" },
{ symbol: "HEI", name: "HEICO Corporation", sector: "Industrials", market: "SP400" },
{ symbol: "HHC", name: "Howard Hughes Holdings", sector: "Real Estate", market: "SP400" },
{ symbol: "HI", name: "Hillenbrand", sector: "Industrials", market: "SP400" },
{ symbol: "HOG", name: "Harley-Davidson", sector: "Consumer Discretionary", market: "SP400" },
{ symbol: "HOMB", name: "Home BancShares", sector: "Financials", market: "SP400" },
{ symbol: "HP", name: "Helmerich & Payne", sector: "Energy", market: "SP400" },
{ symbol: "HQY", name: "HealthEquity", sector: "Healthcare", market: "SP400" },
{ symbol: "HRB", name: "H&R Block", sector: "Consumer Discretionary", market: "SP400" },
{ symbol: "HWC", name: "Hancock Whitney", sector: "Financials", market: "SP400" },
{ symbol: "IDA", name: "IDACORP", sector: "Utilities", market: "SP400" },
{ symbol: "IPAR", name: "Inter Parfums", sector: "Consumer Staples", market: "SP400" },
{ symbol: "JHG", name: "Janus Henderson Group", sector: "Financials", market: "SP400" },
{ symbol: "JWN", name: "Nordstrom", sector: "Consumer Discretionary", market: "SP400" },
{ symbol: "KBR", name: "KBR Inc.", sector: "Industrials", market: "SP400" },
{ symbol: "KEX", name: "Kirby Corporation", sector: "Industrials", market: "SP400" },
{ symbol: "KNX", name: "Knight-Swift Transportation", sector: "Industrials", market: "SP400" },
{ symbol: "LAD", name: "Lithia Motors", sector: "Consumer Discretionary", market: "SP400" },
{ symbol: "LECO", name: "Lincoln Electric Holdings", sector: "Industrials", market: "SP400" },
{ symbol: "LEA", name: "Lear Corporation", sector: "Consumer Discretionary", market: "SP400" },
{ symbol: "LNTH", name: "Lantheus Holdings", sector: "Healthcare", market: "SP400" },
{ symbol: "MANH", name: "Manhattan Associates", sector: "Technology", market: "SP400" },
{ symbol: "MAN", name: "ManpowerGroup", sector: "Industrials", market: "SP400" },
{ symbol: "MEDP", name: "Medpace Holdings", sector: "Healthcare", market: "SP400" },
{ symbol: "MKTX", name: "MarketAxess Holdings", sector: "Financials", market: "SP400" },
{ symbol: "MHK", name: "Mohawk Industries", sector: "Consumer Discretionary", market: "SP400" },
{ symbol: "MIDD", name: "Middleby Corporation", sector: "Industrials", market: "SP400" },
{ symbol: "MOD", name: "Modine Manufacturing", sector: "Industrials", market: "SP400" },
{ symbol: "MTG", name: "MGIC Investment", sector: "Financials", market: "SP400" },
{ symbol: "MTH", name: "Meritage Homes", sector: "Consumer Discretionary", market: "SP400" },
{ symbol: "MTN", name: "Vail Resorts", sector: "Consumer Discretionary", market: "SP400" },
{ symbol: "NBIX", name: "Neurocrine Biosciences", sector: "Healthcare", market: "SP400" },
{ symbol: "NJR", name: "New Jersey Resources", sector: "Utilities", market: "SP400" },
{ symbol: "NOVT", name: "Novanta Inc.", sector: "Technology", market: "SP400" },
{ symbol: "NVT", name: "nVent Electric", sector: "Industrials", market: "SP400" },
{ symbol: "NYT", name: "New York Times Company", sector: "Communication Services", market: "SP400" },
{ symbol: "OC", name: "Owens Corning", sector: "Industrials", market: "SP400" },
{ symbol: "OGE", name: "OGE Energy", sector: "Utilities", market: "SP400" },
{ symbol: "OGS", name: "ONE Gas", sector: "Utilities", market: "SP400" },
{ symbol: "OLN", name: "Olin Corporation", sector: "Materials", market: "SP400" },
{ symbol: "ORA", name: "Ormat Technologies", sector: "Utilities", market: "SP400" },
{ symbol: "OSK", name: "Oshkosh Corporation", sector: "Industrials", market: "SP400" },
{ symbol: "OVV", name: "Ovintiv", sector: "Energy", market: "SP400" },
{ symbol: "PAYC", name: "Paycom Software", sector: "Technology", market: "SP400" },
{ symbol: "PB", name: "Prosperity Bancshares", sector: "Financials", market: "SP400" },
{ symbol: "PCTY", name: "Paylocity Holding", sector: "Technology", market: "SP400" },
{ symbol: "PII", name: "Polaris Inc.", sector: "Consumer Discretionary", market: "SP400" },
{ symbol: "PNW", name: "Pinnacle West Capital", sector: "Utilities", market: "SP400" },
{ symbol: "POST", name: "Post Holdings", sector: "Consumer Staples", market: "SP400" },
{ symbol: "POWI", name: "Power Integrations", sector: "Technology", market: "SP400" },
{ symbol: "PRI", name: "Primerica", sector: "Financials", market: "SP400" },
{ symbol: "PTEN", name: "Patterson-UTI Energy", sector: "Energy", market: "SP400" },
{ symbol: "R", name: "Ryder System", sector: "Industrials", market: "SP400" },
{ symbol: "RBC", name: "RBC Bearings", sector: "Industrials", market: "SP400" },
{ symbol: "RGLD", name: "Royal Gold", sector: "Materials", market: "SP400" },
{ symbol: "RHI", name: "Robert Half International", sector: "Industrials", market: "SP400" },
{ symbol: "RHP", name: "Ryman Hospitality Properties", sector: "Real Estate", market: "SP400" },
{ symbol: "RNR", name: "RenaissanceRe Holdings", sector: "Financials", market: "SP400" },
{ symbol: "RPM", name: "RPM International", sector: "Materials", market: "SP400" },
{ symbol: "SAM", name: "Boston Beer Company", sector: "Consumer Staples", market: "SP400" },
{ symbol: "SAIA", name: "Saia Inc.", sector: "Industrials", market: "SP400" },
{ symbol: "SCI", name: "Service Corporation International", sector: "Consumer Discretionary", market: "SP400" },
{ symbol: "SFBS", name: "ServisFirst Bancshares", sector: "Financials", market: "SP400" },
{ symbol: "SKX", name: "Skechers U.S.A.", sector: "Consumer Discretionary", market: "SP400" },
{ symbol: "SLAB", name: "Silicon Laboratories", sector: "Technology", market: "SP400" },
{ symbol: "SMAR", name: "Smartsheet", sector: "Technology", market: "SP400" },
{ symbol: "SNV", name: "Synovus Financial", sector: "Financials", market: "SP400" },
{ symbol: "SON", name: "Sonoco Products", sector: "Materials", market: "SP400" },
{ symbol: "SSD", name: "Simpson Manufacturing", sector: "Industrials", market: "SP400" },
{ symbol: "SWX", name: "Southwest Gas Holdings", sector: "Utilities", market: "SP400" },
{ symbol: "TDC", name: "Teradata Corporation", sector: "Technology", market: "SP400" },
{ symbol: "TECH", name: "Bio-Techne", sector: "Healthcare", market: "SP400" },
{ symbol: "THO", name: "Thor Industries", sector: "Consumer Discretionary", market: "SP400" },
{ symbol: "TKO", name: "TKO Group Holdings", sector: "Communication Services", market: "SP400" },
{ symbol: "TMHC", name: "Taylor Morrison Home", sector: "Consumer Discretionary", market: "SP400" },
{ symbol: "TNL", name: "Travel + Leisure Co.", sector: "Consumer Discretionary", market: "SP400" },
{ symbol: "TREX", name: "Trex Company", sector: "Industrials", market: "SP400" },
{ symbol: "TTEK", name: "Tetra Tech", sector: "Industrials", market: "SP400" },
{ symbol: "TXRH", name: "Texas Roadhouse", sector: "Consumer Discretionary", market: "SP400" },
{ symbol: "UFPI", name: "UFP Industries", sector: "Industrials", market: "SP400" },
{ symbol: "UTHR", name: "United Therapeutics", sector: "Healthcare", market: "SP400" },
{ symbol: "VLY", name: "Valley National Bancorp", sector: "Financials", market: "SP400" },
{ symbol: "VMI", name: "Valmont Industries", sector: "Industrials", market: "SP400" },
{ symbol: "VNO", name: "Vornado Realty Trust", sector: "Real Estate", market: "SP400" },
{ symbol: "WFRD", name: "Weatherford International", sector: "Energy", market: "SP400" },
{ symbol: "WH", name: "Wyndham Hotels & Resorts", sector: "Consumer Discretionary", market: "SP400" },
{ symbol: "WLK", name: "Westlake Corporation", sector: "Materials", market: "SP400" },
{ symbol: "WMS", name: "Advanced Drainage Systems", sector: "Industrials", market: "SP400" },
{ symbol: "WTS", name: "Watts Water Technologies", sector: "Industrials", market: "SP400" },
{ symbol: "X", name: "United States Steel", sector: "Materials", market: "SP400" },
{ symbol: "YETI", name: "YETI Holdings", sector: "Consumer Discretionary", market: "SP400" },
{ symbol: "ZWS", name: "Zurn Elkay Water Solutions", sector: "Industrials", market: "SP400" }
];

const newStocks = [...dax40, ...eurostoxx50, ...ftse100, ...aex25, ...ibex35, ...smi20, ...sp400];

const stockUniverseContent = fs.readFileSync('/home/theo/Helios/src/lib/data/stock-universe.ts', 'utf-8');
const match = stockUniverseContent.match(/export const DEFAULT_STOCKS: StockInfo\\[\\] = \\[(.*?)\\];/s);

if (match) {
  const existingStr = match[1];
  const oldStocks = [];
  const lines = existingStr.split('\\n');
  for (const line of lines) {
    if (line.trim() === '') continue;
    const symMatch = line.match(/symbol: "(.*?)"/);
    const nameMatch = line.match(/name: "(.*?)"/);
    const sectorMatch = line.match(/sector: "(.*?)"/);
    
    if (symMatch && nameMatch && sectorMatch) {
      const sym = symMatch[1];
      let market = sym.endsWith('.PA') ? 'CAC40' : 'SP500';
      oldStocks.push({ symbol: sym, name: nameMatch[1], sector: sectorMatch[1], market: market });
    }
  }

  const allStocks = [];
  const seen = new Set();
  
  for (const s of oldStocks) {
    if (!seen.has(s.symbol)) {
      seen.add(s.symbol);
      allStocks.push(s);
    }
  }
  
  for (const s of newStocks) {
    if (!seen.has(s.symbol)) {
      seen.add(s.symbol);
      allStocks.push(s);
    }
  }

  allStocks.sort((a, b) => a.symbol.localeCompare(b.symbol));
  
  const contentStart = "// ---------------------------------------------------------------------------\\n" +
"// Stock Universe – comprehensive list including global indices\\n" +
"// ---------------------------------------------------------------------------\\n" +
"\\n" +
"export interface StockInfo {\\n" +
"  symbol: string;\\n" +
"  name: string;\\n" +
"  sector: string;\\n" +
"  market?: string;\\n" +
"}\\n" +
"\\n" +
"export const SECTORS = [\\n" +
"  'Technology',\\n" +
"  'Healthcare',\\n" +
"  'Financials',\\n" +
"  'Consumer Discretionary',\\n" +
"  'Communication Services',\\n" +
"  'Industrials',\\n" +
"  'Consumer Staples',\\n" +
"  'Energy',\\n" +
"  'Utilities',\\n" +
"  'Real Estate',\\n" +
"  'Materials',\\n" +
"] as const;\\n" +
"\\n" +
"export type SectorName = (typeof SECTORS)[number];\\n" +
"\\n" +
"export const BENCHMARK_SYMBOL = 'SPY';\\n" +
"\\n" +
"export const MARKET_BENCHMARKS: Record<string, string> = {\\n" +
"  SP500: 'SPY',\\n" +
"  SP400: 'MDY',\\n" +
"  CAC40: '^FCHI',\\n" +
"  DAX40: '^GDAXI',\\n" +
"  FTSE100: '^FTSE',\\n" +
"  EUROSTOXX50: '^STOXX50E',\\n" +
"  AEX25: '^AEX',\\n" +
"  IBEX35: '^IBEX',\\n" +
"  SMI20: '^SSMI',\\n" +
"};\\n" +
"\\n" +
"/**\\n" +
" * Large-cap and Mid-cap stocks across global markets.\\n" +
" */\\n" +
"export const DEFAULT_STOCKS: StockInfo[] = [\\n";

  let contentMiddle = "";
  for (const s of allStocks) {
    const name = s.name.replace(/"/g, '\\\\\"');
    contentMiddle += "  { symbol: \\"" + s.symbol + "\\", name: \\"" + name + "\\", sector: \\"" + s.sector + "\\", market: \\"" + s.market + "\\" },\\n";
  }

  const contentEnd = "];\\n" +
"\\n" +
"/** Quick symbol → StockInfo lookup */\\n" +
"export const STOCK_MAP = new Map<string, StockInfo>(\\n" +
"  DEFAULT_STOCKS.map((s) => [s.symbol, s]),\\n" +
");\\n" +
"\\n" +
"/** Return all stocks belonging to a given sector. */\\n" +
"export function getStocksBySector(sector: SectorName): StockInfo[] {\\n" +
"  return DEFAULT_STOCKS.filter((s) => s.sector === sector);\\n" +
"}\\n" +
"\\n" +
"/** All unique symbols in the default universe. */\\n" +
"export const DEFAULT_SYMBOLS: string[] = DEFAULT_STOCKS.map((s) => s.symbol);\\n";

  fs.writeFileSync('/home/theo/Helios/src/lib/data/stock-universe.ts', contentStart + contentMiddle + contentEnd);
  console.log("Updated stock-universe.ts with " + allStocks.length + " stocks.");
} else {
  console.log("Could not match the regex");
}
