import db, { initDb } from './src/lib/db.ts';

initDb();

// Clear existing data to avoid duplicates
db.exec('DELETE FROM ba_projects');
db.exec('DELETE FROM life_hobbies');
db.exec('DELETE FROM services');
db.exec('DELETE FROM career_milestones');
db.exec('DELETE FROM assets');
db.exec('DELETE FROM calendar');

// Seed Profile
const profileStmt = db.prepare(`
  INSERT OR REPLACE INTO profile (
    id, full_name, job_title_model, job_title_ba, bio, avatar_url, 
    fb_link, ig_link, zalo_link, linkedin_link, 
    height, weight, bust, waist, hips, 
    birth_date, address, phone, email, university, gpa, subjects, career_goal, current_location
  )
  VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

profileStmt.run(
  'Hà Thị Thu Phương',
  'Editorial Muse',
  'Business Analyst Professional',
  'Trở thành một BA xuất sắc, cầu nối hoàn hảo giữa công nghệ và mỹ thuật. Creating logical solutions with an aesthetic soul.',
  '/input_file_4.png', // Avatar: Wedding Dress Portrait
  'https://www.facebook.com/share/17zvLV3sdQ/',
  'https://www.instagram.com/thuphuong_yams?igsh=a3d2Y3Vvb25vbWNh',
  'https://zalo.me/0325706636',
  'https://github.com/phuongthu',
  160, 48, 85, 64, 92,
  '03/04/2005',
  'Số 4 ngách 24/50 ngõ 24 Đại Mỗ, Từ Liêm, Hà Nội',
  '0325706636',
  'thuphuong342005@gmail.com',
  'Đại học CMC',
  '3.22',
  JSON.stringify(['Phân tích hệ thống thông tin', 'Quản trị dự án phần mềm', 'Thiết kế UI/UX', 'CSDL nâng cao', 'Phân tích yêu cầu']),
  'Khảo sát yêu cầu, tài liệu hóa chuyên nghiệp, tối ưu hóa quy trình doanh nghiệp bằng giải pháp công nghệ.',
  'Hà Nội'
);

// Seed BA Projects
const baProjectStmt = db.prepare(`
  INSERT INTO ba_projects (title, role, description, images, flowchart_url, github_url, tags, grid_class)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

baProjectStmt.run(
  'AI Shoe Identity System',
  'Lead Business Analyst',
  'Hệ thống nhận diện giày thông minh sử dụng AI để hỗ trợ tìm kiếm và phân tích xu hướng thời trang.',
  JSON.stringify([
    '/input_file_1.png',
    '/input_file_5.png',
    '/input_file_8.png'
  ]),
  '#',
  'https://github.com/phuongthu',
  JSON.stringify(['Python', 'PyTorch', 'React', 'FastAPI']),
  'md:col-span-2 md:row-span-2'
);

baProjectStmt.run(
  'Youth E-Voting App',
  'Senior UI/UX Researcher',
  'Ứng dụng bỏ phiếu điện tử cho thanh niên với tính bảo mật cao và trải nghiệm người dùng tối ưu.',
  JSON.stringify([
    '/input_file_3.png',
    '/input_file_2.png'
  ]),
  '#',
  'https://github.com/phuongthu',
  JSON.stringify(['React Native', 'Firebase', 'Figma']),
  'md:col-span-2 md:row-span-1'
);

// Seed Life & Hobbies
const lifeHobbiesStmt = db.prepare(`
  INSERT INTO life_hobbies (image_url, title, thought, date, location)
  VALUES (?, ?, ?, ?, ?)
`);

lifeHobbiesStmt.run(
  '/input_file_1.png',
  'Field Trip Inspiration',
  'Tìm kiếm cảm hứng từ thiên nhiên để tối ưu hóa trải nghiệm người dùng.',
  '15/04/2026',
  'Bãi đá Sông Hồng'
);

lifeHobbiesStmt.run(
  '/input_file_8.png',
  'Artistic Vision',
  'Năng lượng sáng tạo qua lăng kính nghệ thuật.',
  '10/04/2026',
  'Studio Space'
);

// Seed Services
const serviceStmt = db.prepare(`
  INSERT INTO services (mode, title, description, icon_name, benefits, stat_label, stat_value)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

serviceStmt.run('model', 'Fashion Model', 'Chụp lookbook, campaign, runway chuyên nghiệp với phong cách đa dạng.', 'Camera', JSON.stringify(['Lookbook', 'Campaign', 'Runway']), 'Đã thực hiện', '50+ Brand');
serviceStmt.run('ba', 'Business Analysis', 'Khảo sát yêu cầu, tài liệu hóa (SRS, BRD), làm cầu nối giữa Business và Tech.', 'Briefcase', JSON.stringify(['SRS/BRD', 'SQL', 'Agile']), 'Kinh nghiệm', '10+ Dự án');
serviceStmt.run('ba', 'UI/UX Research', 'Thiết kế giao diện hiện đại, tối ưu trải nghiệm người dùng dựa trên data.', 'Palette', JSON.stringify(['Figma', 'Wireframing', 'Prototyping']), 'Rating', '4.9/5');

// Seed Banner Assets
const assetStmt = db.prepare(`
  INSERT INTO assets (type, url, title, metadata)
  VALUES (?, ?, ?, ?)
`);

const preWeddingMetadata = JSON.stringify({
  location: { lat: 20.9785, lng: 105.7831, name: "Ga Văn Quán - 149 Trần Phú, Hà Đông, Hà Nội" },
  date: "15/07/2025",
  credits: {
    model: [
      { name: "Phương Thu", link: "https://www.facebook.com/share/17zvLV3sdQ/" },
      { name: "Văn Thánh", link: "https://www.facebook.com/share/15i4XZyHwip/" }
    ],
    makeup: [
      { name: "Nguyễn Thùy Linh", link: "https://www.facebook.com/share/1JrVNpHjBX/" }
    ],
    photo: [
      { name: "Phung Thee Ngoc", link: "https://www.facebook.com/share/1FuuYU78DF/" },
      { name: "Huy Lê", link: "https://www.facebook.com/share/14ZYzrBhanX/" },
      { name: "Vu Anh Tran", link: "https://www.facebook.com/share/1HtB4zJmHL/" }
    ]
  }
});

const defaultMetadata = (locationName: string) => JSON.stringify({
  location: { lat: 21.0285, lng: 105.8542, name: locationName },
  date: "Spring 2025",
  credits: {
    model: [{ name: "Hà Thị Thu Phương", link: "https://www.facebook.com/share/17zvLV3sdQ/" }],
    makeup: [{ name: "Nguyễn Thùy Linh", link: "https://www.facebook.com/share/1JrVNpHjBX/" }],
    photo: [{ name: "Phung Thee Ngoc", link: "https://www.facebook.com/share/1FuuYU78DF/" }]
  }
});

// Model Banners
assetStmt.run('model_banner', '/input_file_2.png', 'Editorial Portfolio I', null);
assetStmt.run('model_banner', '/input_file_4.png', 'Pure Wedding Spirit', preWeddingMetadata);
assetStmt.run('model_banner', '/input_file_7.png', 'Traditional Elegance', null);

// Summer Lookbook
assetStmt.run('lookbook', '/input_file_3.png', 'Vintage Indoor', null);
assetStmt.run('lookbook', '/input_file_5.png', 'Cyan Muse', null);
assetStmt.run('lookbook', '/input_file_6.png', 'Traditional Outdoor', null);

// BA Banners
assetStmt.run('ba_banner', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80', 'Data Analysis 1', null);
assetStmt.run('ba_banner', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80', 'Tech Workspace', null);
assetStmt.run('ba_banner', 'https://images.unsplash.com/photo-1551288049-bbbda5466b1a?auto=format&fit=crop&q=80', 'System Flow', null);

const diaryStmt = db.prepare(`
  INSERT INTO assets (type, url, title, date, location, metadata, grid_class, photographer, makeup)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

diaryStmt.run('model_diary', '/input_file_0.png', 'Pre wedding ngầu phá cách', '15/07/2025', 'Ga Văn Quán - 149 Trần Phú, Hà Đông, Hà Nội', preWeddingMetadata, 'col-span-2 row-span-2', 'Phung Thee Ngoc', 'Nguyễn Thùy Linh');
diaryStmt.run('model_diary', '/input_file_1.png', 'Summer Field', '20/06/2025', 'Bãi đá Sông Hồng', null, 'col-span-1 row-span-1', null, null);
diaryStmt.run('model_diary', '/input_file_2.png', 'Traditional Vibe', '10/06/2025', 'Cầu Long Biên', null, 'col-span-1 row-span-1', null, null);
diaryStmt.run('model_diary', '/input_file_3.png', 'Vintage Soul', '05/06/2025', 'Phố cổ Hà Nội', null, 'col-span-1 row-span-1', null, null);
diaryStmt.run('model_diary', '/input_file_7.png', 'Floral Breath', '01/06/2025', 'Studio', null, 'col-span-1 row-span-1', null, null);
diaryStmt.run('model_diary', '/input_file_4.png', 'Pure Wedding', '28/05/2025', 'Công viên Thống Nhất', null, 'col-span-1 row-span-2', null, null);
diaryStmt.run('model_diary', '/input_file_9.png', 'Urban Romance', '25/05/2025', 'Studio', null, 'col-span-2 row-span-1', null, null);
diaryStmt.run('model_diary', '/input_file_8.png', 'Spring Shine', '20/05/2025', 'Hồ Tây', null, 'col-span-1 row-span-1', null, null);

// Seed Career Milestones
const milestoneStmt = db.prepare(`
  INSERT INTO career_milestones (period, role, company, type, status, description, projects)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

milestoneStmt.run(
  '01/03/2026 - 28/02/2027',
  'Business Analyst',
  'CMC Corporation',
  'Full-time',
  'active',
  'Phân tích nghiệp vụ, điều phối dự án FinTech.',
  JSON.stringify(['AI System', 'Banking App'])
);

milestoneStmt.run(
  '28/12/2025 - 28/02/2026',
  'BA Probational',
  'FPT Software',
  'Probation',
  'completed',
  'Tham gia khảo sát yêu cầu khách hàng Nhật Bản.',
  JSON.stringify(['E-commerce Platform'])
);

milestoneStmt.run(
  '15/09/2025 - 25/12/2025',
  'BA Intern',
  'Viettel Solutions',
  'Internship',
  'completed',
  'Hỗ trợ viết tài liệu SRS và vẽ BPMN.',
  JSON.stringify(['Government Services'])
);

console.log('Seeding complete');
