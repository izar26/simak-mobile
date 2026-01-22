import notifee, { AndroidImportance, TriggerType, TimestampTrigger } from '@notifee/react-native';

// Helper: Ambil info libur jika tanggal tersebut merah
const getHoliday = (date: Date, holidays: any[]) => {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  
  return holidays.find(h => {
    const start = h.tanggal_mulai;
    const end = h.tanggal_selesai;
    return dateStr >= start && dateStr <= end;
  });
};

// Helper: Ubah nama hari
const getDayName = (date: Date) => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[date.getDay()];
};

export const setupNotifications = async (scheduleData: any, holidays: any[]) => {
  // 1. Request Permission
  await notifee.requestPermission();

  // 2. Buat Channel
  const channelId = await notifee.createChannel({
    id: 'jadwal_sekolah',
    name: 'Jadwal Sekolah',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });

  // 3. Batalkan semua notifikasi lama (RESET)
  // Ini menjawab pertanyaan Anda: Saat aplikasi dibuka tgl 10, 
  // alarm lama dihapus, lalu kita buat baru start dari tgl 10.
  await notifee.cancelAllNotifications();

  // 4. Generate Notifikasi untuk 30 HARI KE DEPAN (1 Bulan)
  const DAYS_TO_SCHEDULE = 30; 
  const now = new Date();

  console.log('--- START SCHEDULING NOTIFICATIONS (30 DAYS) ---');
  let count = 0;

  for (let i = 0; i < DAYS_TO_SCHEDULE; i++) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + i);
    
    // CEK HARI LIBUR
    const holiday = getHoliday(targetDate, holidays);
    
    if (holiday) {
      // Jika Libur, Pasang Notifikasi Pagi (06:30)
      const notifHoliday = new Date(targetDate);
      notifHoliday.setHours(6, 30, 0, 0);

      // Hanya jadwalkan jika belum lewat jam 06:30
      if (notifHoliday.getTime() > Date.now()) {
        const trigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: notifHoliday.getTime(),
        };

        await notifee.createTriggerNotification(
          {
            title: `🏖️ Hari Libur!`,
            body: `${holiday.keterangan}. Selamat beristirahat!`,
            android: { 
              channelId, 
              pressAction: { id: 'default' },
              style: { type: 1, text: `${holiday.keterangan}. Selamat beristirahat!` } // BigText style
            },
          },
          trigger,
        );
        count++;
        console.log(`Scheduled Holiday: ${targetDate.toDateString()} - ${holiday.keterangan}`);
      }
      
      // SKIP jadwal pelajaran hari ini karena libur
      continue; 
    }

    // CEK JADWAL PELAJARAN
    const dayName = getDayName(targetDate);
    const dailySchedule = scheduleData[dayName]; 

    if (dailySchedule && dailySchedule.length > 0) {
      for (const item of dailySchedule) {
        const startTime = item.jam.split(' - ')[0]; 
        const [hour, minute] = startTime.split(':').map(Number);

        // Alarm 1: 5 Menit Sebelum
        const notifDatePre = new Date(targetDate);
        notifDatePre.setHours(hour, minute - 5, 0, 0);

        if (notifDatePre.getTime() > Date.now()) {
          const triggerPre: TimestampTrigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: notifDatePre.getTime(),
          };

          await notifee.createTriggerNotification(
            {
              title: `5 Menit Lagi: ${item.mapel}`,
              body: `Persiapkan diri kamu! ${item.is_non_kbm ? '' : `Guru: ${item.guru}`}`,
              android: { channelId, pressAction: { id: 'default' } },
            },
            triggerPre,
          );
          count++;
        }

        // Alarm 2: Pas Masuk
        const notifDateOn = new Date(targetDate);
        notifDateOn.setHours(hour, minute, 0, 0);

        if (notifDateOn.getTime() > Date.now()) {
          const triggerOn: TimestampTrigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: notifDateOn.getTime(),
          };

          await notifee.createTriggerNotification(
            {
              title: `🔔 Waktunya: ${item.mapel}`,
              body: `${item.is_non_kbm ? 'Selamat beraktivitas!' : `Pelajaran dimulai. Guru: ${item.guru}`}`,
              android: { channelId, pressAction: { id: 'default' } },
            },
            triggerOn,
          );
          count++;
        }
      }
    }
  }

  console.log(`--- SCHEDULED TOTAL ${count} NOTIFICATIONS ---`);
};

export const triggerNewsNotification = async (news: any) => {
  const channelId = 'news_channel';
  await notifee.createChannel({
    id: channelId,
    name: 'Berita Sekolah',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title: 'Berita Baru: ' + news.judul,
    body: 'Ketuk untuk membaca berita terbaru dari sekolah.',
    android: {
      channelId,
      pressAction: { id: 'default' },
      style: { type: 1, text: news.ringkasan || 'Ketuk untuk membaca selengkapnya.' }, // BigText
      // largeIcon: news.gambar ? ... (butuh download dulu, skip for now)
    },
  });
};