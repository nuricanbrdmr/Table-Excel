import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Table } from "antd";
import type { ColumnType } from "antd/es/table";
import { TableRowSelection } from "antd/es/table/interface";

interface DataTuru {
  key: React.Key;
  isim: string;
  yas: number;
  adres: string;
  telefon: string;
}

const sutunlar: ColumnType<DataTuru>[] = [
  { title: "İsim", dataIndex: "isim", key: "isim", width: "25%" },
  { title: "Yaş", dataIndex: "yas", key: "yas", width: "10%" },
  { title: "Adres", dataIndex: "adres", key: "adres", width: "40%" },
  { title: "Telefon", dataIndex: "telefon", key: "telefon", width: "20%" },
];

const tumData: DataTuru[] = Array.from({ length: 50 }, (_, i) => ({
  key: i,
  isim: `Nuri Can Birdemir ${i + 1}`,
  yas: 11 + i,
  adres: `Hadımköy, Baykar Özdemir Bayraktar Merkezi . ${i + 1}`,
  telefon: `0512 345 789${(i + 1) % 10}`,
})).sort(() => Math.random() - 0.5);

const TabloExcel: React.FC<ColumnType> = () => {
  const [state, setState] = useState({
    secilenHucreler: new Set(),
    gecerliSayfa: 1,
    sayfaBoyutu: 10,
    seciliyorMu: false,
    baslangicHucresi: null as { satir: number; sutun: number } | null,
    shiftBasiliMi: false,
    yukleniyor: false,
    seciliSatirAnahtarlari: [] as React.Key[],
    seciliSatirData: [] as DataTuru[],
  });

  const stateGuncelle = useCallback((yeniState: Partial<typeof state>) => {
    setState((prevState) => ({ ...prevState, ...yeniState }));
  }, []);

  const kaynakData = useMemo(() => {
    const baslangicIndex = (state.gecerliSayfa - 1) * state.sayfaBoyutu;
    return tumData.slice(
      baslangicIndex,
      baslangicIndex + state.sayfaBoyutu
    );
  }, [state.gecerliSayfa, state.sayfaBoyutu, tumData]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Shift") stateGuncelle({ shiftBasiliMi: true });
      if (event.ctrlKey && event.key === "c") kopyala();
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") stateGuncelle({ shiftBasiliMi: false });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [state.secilenHucreler, state.seciliSatirAnahtarlari]);

  useEffect(() => {
    if (state.secilenHucreler.size > 0 || state.seciliSatirData.length > 0) {
      localStorage.setItem(
        "tabloVerileri",
        JSON.stringify({
          secilenHucreler: Array.from(state.secilenHucreler),
          seciliSatirlar: state.seciliSatirData,
          gecerliSayfa: state.gecerliSayfa,
          sayfaBoyutu: state.sayfaBoyutu,
        })
      );
    }
  }, [
    state.secilenHucreler,
    state.seciliSatirData,
    state.gecerliSayfa,
    state.sayfaBoyutu,
  ]);

  useEffect(() => {
    const kayitliVeriler = localStorage.getItem("tabloVerileri");
    if (kayitliVeriler) {
      const {
        secilenHucreler,
        seciliSatirlar,
        gecerliSayfa: kayitliSayfa,
        sayfaBoyutu: kayitliBoyut,
      } = JSON.parse(kayitliVeriler);
      stateGuncelle({
        secilenHucreler: new Set(secilenHucreler),
        seciliSatirData: seciliSatirlar,
        seciliSatirAnahtarlari: seciliSatirlar.map(
          (item: DataTuru) => item.key
        ),
        gecerliSayfa: kayitliSayfa,
        sayfaBoyutu: kayitliBoyut,
      });
    }
  }, []);

  const sayfalandirmaDegisikligi = useCallback(
    (sayfa: number, boyut?: number) => {
      stateGuncelle({
        yukleniyor: true,
        gecerliSayfa: sayfa,
        sayfaBoyutu: boyut || state.sayfaBoyutu,
      });
      setTimeout(() => stateGuncelle({ yukleniyor: false }), 500);
    },
    [state.sayfaBoyutu]
  );

  const hucreMouseDown = (veri: DataTuru, sutunKey: keyof DataTuru) => {
    if (!state.shiftBasiliMi) {
      stateGuncelle({  secilenHucreler: new Set() });
    }
    stateGuncelle({   
      seciliyorMu: true,
      baslangicHucresi: {
        satir: tumData.findIndex((item) => item.key === veri.key),
        sutun: sutunlar.findIndex((sutun) => sutun.dataIndex === sutunKey),
      },});

    hucreSeciminidegistir(veri, sutunKey);
  };

  const hucreMouseOver = (veri: DataTuru, sutunKey: keyof DataTuru) => {
    if (state.seciliyorMu && state.baslangicHucresi) {
      const bitisSatir = tumData.findIndex(
        (item) => item.key === veri.key
      );
      const bitisSutun = sutunlar.findIndex(
        (sutun) => sutun.dataIndex === sutunKey
      );
      aralikSecimiYap(state.baslangicHucresi, {
        satir: bitisSatir,
        sutun: bitisSutun,
      });
    }
  };

  const hucreMouseUp = () => {
    stateGuncelle({  seciliyorMu: false, baslangicHucresi: null, });
  };

  const hucreSeciminidegistir = (veri: DataTuru, sutunKey: keyof DataTuru) => {
    const hucreKey = `${veri.key}-${sutunKey}`;
    setState((prevState) => {
      const yeniSet = new Set(prevState.secilenHucreler);
      yeniSet.has(hucreKey)
        ? yeniSet.delete(hucreKey)
        : yeniSet.add(hucreKey);
      return {
        ...prevState,
        secilenHucreler: yeniSet,
      };
    });
  };


  const aralikSecimiYap = (
    baslangic: { satir: number; sutun: number },
    bitis: { satir: number; sutun: number }
  ) => {
    const minSatir = Math.min(baslangic.satir, bitis.satir);
    const maxSatir = Math.max(baslangic.satir, bitis.satir);
    const minSutun = Math.min(baslangic.sutun, bitis.sutun);
    const maxSutun = Math.max(baslangic.sutun, bitis.sutun);

    const yeniSecimler = new Set(state.secilenHucreler);

    for (let satir = minSatir; satir <= maxSatir; satir++) {
      for (let sutun = minSutun; sutun <= maxSutun; sutun++) {
        const veri = tumData[satir];
        const sutunKey = sutunlar[sutun].dataIndex;
        const hucreKey = `${veri.key}-${sutunKey}`;
        yeniSecimler.add(hucreKey);
      }
    }
    stateGuncelle({ secilenHucreler: yeniSecimler });
  };

  const hucreSeciliMi = (veri: DataTuru, sutunKey: keyof DataTuru) => {
    return state.secilenHucreler.has(`${veri.key}-${sutunKey}`);
  };

  const kopyala = () => {
    const satirSutunGruplari: { [satir: number]: string[] } = {};
    tumData.forEach((veri, satirIndex) => {
      sutunlar.forEach((sutun, sutunIndex) => {
        const sutunKey = sutun.dataIndex as keyof DataTuru;
        const hucreDegeri = veri[sutunKey].toString();
        const hucreKey = `${veri.key}-${sutunKey}`;
        if (
          state.secilenHucreler.has(hucreKey) ||
          state.seciliSatirAnahtarlari.includes(veri.key)
        ) {
          if (!satirSutunGruplari[satirIndex])
            satirSutunGruplari[satirIndex] = [];
          satirSutunGruplari[satirIndex][sutunIndex] = hucreDegeri;
        }
      });
    });
    const tabloMetni = Object.values(satirSutunGruplari)
      .map((satir) => satir.join("\t"))
      .join("\n");
    navigator.clipboard
      .writeText(tabloMetni)
      .then(() => alert("Veriler kopyalandı!"));
  };

  const sutunBaslikTiklama = (sutunKey: keyof DataTuru) => {
    const yeniSeciliHucreler = new Set(state.secilenHucreler);
    const tumSecilenler = tumData.every((veri) =>
      yeniSeciliHucreler.has(`${veri.key}-${sutunKey}`)
    );

    tumData.forEach((veri) => {
      const hucreKey = `${veri.key}-${sutunKey}`;
      tumSecilenler
        ? yeniSeciliHucreler.delete(hucreKey)
        : yeniSeciliHucreler.add(hucreKey);
    });
    stateGuncelle({ secilenHucreler: yeniSeciliHucreler });
  };

  const tabloSutunlari: ColumnType<DataTuru>[] = sutunlar.map((sutun) => ({
    ...sutun,
    onHeaderCell: () => ({
      onClick: () => sutunBaslikTiklama(sutun.dataIndex as keyof DataTuru),
      style: {
        cursor: "pointer",
      },
    }),
    onCell: (veri: DataTuru) => ({
      onMouseDown: () =>
        hucreMouseDown(veri, sutun.dataIndex as keyof DataTuru),
      onMouseOver: () =>
        hucreMouseOver(veri, sutun.dataIndex as keyof DataTuru),
      onMouseUp: hucreMouseUp,
      style: {
        backgroundColor: hucreSeciliMi(
          veri,
          sutun.dataIndex as keyof DataTuru
        )
          ? "lightblue"
          : "",
        cursor: "pointer",
      },
    }),
  }));

  const seciliSatirDegisikligi = (_: any, yeniSeciliSatirlar: DataTuru[]) => {
    const guncelSeciliSatirlar = [
      ...state.seciliSatirData.filter(
        (satir) => !kaynakData.some((d) => d.key === satir.key)
      ),
      ...yeniSeciliSatirlar,
    ];
    stateGuncelle({
      seciliSatirAnahtarlari: guncelSeciliSatirlar.map((satir) => satir.key),
      seciliSatirData: guncelSeciliSatirlar,
    });
  };

  const satirSecimi: TableRowSelection<DataTuru> = {
    selectedRowKeys: state.seciliSatirAnahtarlari,
    onChange: seciliSatirDegisikligi,
  };

  return (
    <>
      <Table<DataTuru>
        title={() => <h2>Table Excel</h2>}
        columns={tabloSutunlari}
        rowSelection={satirSecimi}
        dataSource={kaynakData}
        bordered
        loading={state.yukleniyor}
        pagination={{
          pageSize: state.sayfaBoyutu,
          onChange: sayfalandirmaDegisikligi,
          current: state.gecerliSayfa,
          total: tumData.length,
          showSizeChanger: true,
        }}
        style={{ userSelect: "none" }}
      />
    </>
  );
};

export default TabloExcel;