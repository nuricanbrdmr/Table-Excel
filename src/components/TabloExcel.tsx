import React, { useState, useEffect, useMemo } from "react";
import { Table } from "antd";
import type { TableColumnsType } from "antd";
import { ColumnType, TableRowSelection } from "antd/es/table/interface";

interface DataTuru {
  key: React.Key;
  isim: string;
  yas: number;
  adres: string;
  telefon: string;
}

const sutunlar: TableColumnsType<DataTuru> = [
  {
    title: "İsim",
    dataIndex: "isim",
  },
  {
    title: "Yaş",
    dataIndex: "yas",
  },
  {
    title: "Adres",
    dataIndex: "adres",
  },
  {
    title: "Telefon",
    dataIndex: "telefon",
  },
];

const TumData: DataTuru[] = Array.from({ length: 50 }).map((_, i) => ({
  key: i,
  isim: `Nuri Can Birdemir ${i + 1}`,
  yas: 10 + i,
  adres: `Hadımköy, Baykar Özdemir Bayraktar Merkezi . ${i + 1}`,
  telefon: `0512 345 789${(i + 1) % 10}`,
}));

const TabloExcel: React.FC = () => {
  const [secilenHucreler, setSecilenHucreler] = useState<Map<string, string>>(new Map());
  const [gecerliSayfa, setGecerliSayfa] = useState(1);
  const [sayfaBoyutu, setSayfaBoyutu] = useState(10);
  const [seciliyorMu, setSeciliyorMu] = useState(false);
  const [baslangicHucresi, setBaslangicHucresi] = useState<{ satir: number; sutun: number } | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [seciliSatirAnahtarlari, setSeciliSatirAnahtarlari] = useState<React.Key[]>([]);
  const [seciliSatirData, setSeciliSatirData] = useState<DataTuru[]>([]);

  // Mevcut sayfanın verilerini hesapla
  const kaynakData = useMemo(() => {
    const baslangicIndex = (gecerliSayfa - 1) * sayfaBoyutu;
    return TumData.slice(baslangicIndex, baslangicIndex + sayfaBoyutu);
  }, [gecerliSayfa, sayfaBoyutu]);

  // Seçili hücreler ve satırları localStorage'dan yükle
  useEffect(() => {
    const secilenHucrelerStorage = localStorage.getItem("secilenHucreler");
    const seciliSatirlarStorage = localStorage.getItem("seciliSatirlar");

    if (secilenHucrelerStorage) {
      setSecilenHucreler(new Map(JSON.parse(secilenHucrelerStorage)));
    }
    if (seciliSatirlarStorage) {
      const varOlanSatirData = JSON.parse(seciliSatirlarStorage);
      setSeciliSatirData(varOlanSatirData);
      setSeciliSatirAnahtarlari(varOlanSatirData.map((item: DataTuru) => item.key));
    }
  }, []);

  // Seçilen verileri localStorage'a kaydet
  useEffect(() => {
    if (secilenHucreler.size > 0) {
      localStorage.setItem(
        "secilenHucreler",
        JSON.stringify(Array.from(secilenHucreler.entries()))
      );
    }
    if (seciliSatirData.length > 0) {
      localStorage.setItem("seciliSatirlar", JSON.stringify(seciliSatirData));
    }
  }, [secilenHucreler, seciliSatirData]);

  const sayfalandirmaDegisikligi = (sayfa: number, boyut?: number) => {
    setYukleniyor(true);
    setGecerliSayfa(sayfa);
    if (boyut) setSayfaBoyutu(boyut);
    setTimeout(() => setYukleniyor(false), 500);
  };

  const hucreMouseDown = (satir: number, sutun: number) => {
    setSeciliyorMu(true);
    setBaslangicHucresi({ satir, sutun });
    hucreSeciminidegistir(satir, sutun);
  };

  const hucreMouseOver = (satir: number, sutun: number) => {
    if (seciliyorMu && baslangicHucresi) {
      hucreSeciminidegistir(satir, sutun);
    }
  };

  const hucreMouseUp = () => {
    setSeciliyorMu(false);
    setBaslangicHucresi(null);
  };

  const hucreSeciminidegistir = (satir: number, sutun: number) => {
    const hucreKey = `${satir}-${sutun}`;
    const sutunData = sutunlar[sutun] as ColumnType<DataTuru>;
    const sutunKey = sutunData.dataIndex as keyof DataTuru;
    const satirData = TumData[satir];

    if (satirData) {
      const hucreDeger = satirData[sutunKey];
      setSecilenHucreler((prev) => {
        const yeniEsleme = new Map(prev);
        if (yeniEsleme.has(hucreKey)) {
          yeniEsleme.delete(hucreKey);
        } else {
          yeniEsleme.set(hucreKey, `${hucreDeger}`);
        }
        return yeniEsleme;
      });
    }
  };

  const hucreSeciliMi = (index: number, sutun: number) => {
    return secilenHucreler.has(`${index}-${sutun}`);
  };

  const sutunBaslikTiklama = (sutunIndex: number) => {
    const yeniSeciliHucreler = new Map(secilenHucreler);
    const tumSecilenler = TumData.every((_, satirIndex) =>
      yeniSeciliHucreler.has(`${satirIndex}-${sutunIndex}`)
    );
  
    TumData.forEach((satirData, satirIndex) => {
      const hucreKey = `${satirIndex}-${sutunIndex}`;
      const sutun = sutunlar[sutunIndex] as ColumnType<DataTuru>;
      const sutunKey = sutun.dataIndex as keyof DataTuru;
      const hucreDegeri = satirData[sutunKey];
  
      if (tumSecilenler) {
        yeniSeciliHucreler.delete(hucreKey);
      } else {
        yeniSeciliHucreler.set(hucreKey, `${hucreDegeri}`);
      }
    });
  
    setSecilenHucreler(yeniSeciliHucreler);
  };
  

  const tabloSutunlari = sutunlar.map((sutun, sutunIndex) => ({
    ...sutun,
    onHeaderCell: () => ({
      onClick: () => sutunBaslikTiklama(sutunIndex),
      style: {
        cursor: "pointer",
      },
    }),
    onCell: (_: any, satirIndex?: number) => {
      const mutlakIndex = (gecerliSayfa - 1) * sayfaBoyutu + (satirIndex || 0);
      return {
        onMouseDown: () => hucreMouseDown(mutlakIndex, sutunIndex),
        onMouseOver: () => hucreMouseOver(mutlakIndex, sutunIndex),
        onMouseUp: hucreMouseUp,
        style: {
          backgroundColor: hucreSeciliMi(mutlakIndex, sutunIndex)
            ? "lightblue"
            : "",
          cursor: "pointer",
        },
      };
    },
  }));

  const seciliSatirDegisikligi = (_: any, yeniSeciliSatirlar: DataTuru[]) => {
    const guncelSeciliSatirlar = [
      ...seciliSatirData.filter(satir => !kaynakData.some(d => d.key === satir.key)),
      ...yeniSeciliSatirlar
    ];
    
    setSeciliSatirAnahtarlari(guncelSeciliSatirlar.map(satir => satir.key));
    setSeciliSatirData(guncelSeciliSatirlar);
  };

  const satirSecimi: TableRowSelection<DataTuru> = {
    selectedRowKeys: seciliSatirAnahtarlari,
    onChange: seciliSatirDegisikligi,
  };

  return (
    <Table<DataTuru>
      columns={tabloSutunlari}
      dataSource={kaynakData}
      rowSelection={satirSecimi}
      bordered
      loading={yukleniyor}
      pagination={{
        pageSize: sayfaBoyutu,
        onChange: sayfalandirmaDegisikligi,
        current: gecerliSayfa,
        total: TumData.length,
        showSizeChanger: true,
      }}
      style={{ userSelect: "none" }}
    />
  );
};

export default TabloExcel