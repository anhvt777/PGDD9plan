// PGDD9 plan web app logic

/*
 * Thay thế hai hằng dưới đây bằng thông tin dự án Supabase của bạn.
 * Bạn có thể tìm URL và Anon key trong trang cài đặt dự án Supabase (Project URL
 * và anon/public API key). Ví dụ:
 *   const SUPABASE_URL = 'https://abcdxyz.supabase.co';
 *   const SUPABASE_ANON_KEY = 'eyJhbGciOiJ...';
 */
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Khởi tạo client Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// DOM elements
const authContainer = document.getElementById('auth-container');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const authMsg = document.getElementById('auth-msg');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');

const appContainer = document.getElementById('app');
const logoutBtn = document.getElementById('logout-btn');
const addTaskBtn = document.getElementById('add-task-btn');
const exportBtn = document.getElementById('export-btn');

const taskTitleInput = document.getElementById('task-title');
const taskDescInput = document.getElementById('task-desc');
const taskDueInput = document.getElementById('task-due');
const taskAssignedInput = document.getElementById('task-assigned');
const taskMsg = document.getElementById('task-msg');

// Column elements
const columns = {
  todo: document.getElementById('todo-list'),
  doing: document.getElementById('doing-list'),
  block: document.getElementById('block-list'),
  done: document.getElementById('done-list'),
};

let currentUser = null;

// Kiểm tra phiên đăng nhập khi trang tải
async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session && data.session.user) {
    currentUser = data.session.user;
    showApp();
  } else {
    showAuth();
  }
}

// Hiển thị giao diện đăng nhập
function showAuth() {
  authContainer.style.display = 'block';
  appContainer.style.display = 'none';
}

// Hiển thị giao diện ứng dụng chính
function showApp() {
  authContainer.style.display = 'none';
  appContainer.style.display = 'block';
  authMsg.textContent = '';
  // Reset form
  taskTitleInput.value = '';
  taskDescInput.value = '';
  taskDueInput.value = '';
  taskAssignedInput.value = '';
  taskMsg.textContent = '';
  // Tải công việc
  loadTasks();
}

// Đăng ký / đăng nhập
signupBtn.addEventListener('click', async () => {
  authMsg.textContent = '';
  const email = authEmailInput.value.trim();
  const password = authPasswordInput.value.trim();
  if (!email || !password) {
    authMsg.textContent = 'Vui lòng nhập email và mật khẩu.';
    return;
  }
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) {
    authMsg.textContent = `Lỗi đăng ký: ${error.message}`;
  } else {
    authMsg.style.color = 'green';
    authMsg.textContent = 'Đăng ký thành công! Kiểm tra email để xác nhận.';
  }
});

loginBtn.addEventListener('click', async () => {
  authMsg.textContent = '';
  const email = authEmailInput.value.trim();
  const password = authPasswordInput.value.trim();
  if (!email || !password) {
    authMsg.textContent = 'Vui lòng nhập email và mật khẩu.';
    return;
  }
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    authMsg.textContent = `Đăng nhập thất bại: ${error.message}`;
  } else {
    currentUser = data.user;
    showApp();
  }
});

// Đăng xuất
logoutBtn.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  currentUser = null;
  showAuth();
});

// Tạo công việc mới
addTaskBtn.addEventListener('click', async () => {
  taskMsg.textContent = '';
  const title = taskTitleInput.value.trim();
  const description = taskDescInput.value.trim();
  const dueDate = taskDueInput.value;
  let assignedEmail = taskAssignedInput.value.trim();
  if (!title) {
    taskMsg.textContent = 'Tiêu đề không được bỏ trống.';
    return;
  }
  if (!assignedEmail) {
    assignedEmail = currentUser.email;
  }
  const { error } = await supabaseClient.from('tasks').insert({
    title,
    description,
    due_date: dueDate || null,
    status: 'todo',
    created_by_email: currentUser.email,
    assigned_email: assignedEmail,
  });
  if (error) {
    taskMsg.textContent = `Không thể tạo công việc: ${error.message}`;
  } else {
    taskMsg.style.color = 'green';
    taskMsg.textContent = 'Đã thêm công việc mới!';
    // Xóa biểu mẫu
    taskTitleInput.value = '';
    taskDescInput.value = '';
    taskDueInput.value = '';
    taskAssignedInput.value = '';
    // Làm mới danh sách
    loadTasks();
  }
});

// Tải và hiển thị danh sách công việc
async function loadTasks() {
  // Xóa nội dung cũ
  Object.keys(columns).forEach((status) => {
    columns[status].innerHTML = '';
  });
  if (!currentUser) return;
  // Lấy tất cả công việc liên quan tới người dùng (tạo bởi hoặc được giao)
  const { data: tasks, error } = await supabaseClient
    .from('tasks')
    .select('*')
    .or(
      `assigned_email.eq.${currentUser.email},created_by_email.eq.${currentUser.email}`
    )
    .order('due_date', { ascending: true });
  if (error) {
    console.error('Lỗi tải công việc', error);
    return;
  }
  // Hiển thị công việc theo trạng thái
  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = `task-card ${task.status}`;
    li.dataset.taskId = task.id;
    li.innerHTML = `<strong>${task.title}</strong>` +
      (task.due_date ? `<small>Hạn: ${task.due_date}</small>` : '') +
      (task.assigned_email && task.assigned_email !== currentUser.email
        ? `<small>Giao cho: ${task.assigned_email}</small>`
        : '');
    // Đưa vào cột tương ứng
    const container = columns[task.status] || columns.todo;
    container.appendChild(li);
  });
  // Kích hoạt drag&drop
  enableDragAndDrop();
}

// Bật kéo thả với SortableJS
function enableDragAndDrop() {
  Object.keys(columns).forEach((status) => {
    new Sortable(columns[status], {
      group: 'tasks',
      animation: 150,
      onEnd: async (evt) => {
        const itemEl = evt.item; // phần tử bị kéo
        const taskId = itemEl.dataset.taskId;
        // Trạng thái mới là cột đích
        const newStatus = evt.to.parentElement.dataset.status;
        // Cập nhật class màu
        itemEl.classList.remove('todo', 'doing', 'block', 'done');
        itemEl.classList.add(newStatus);
        // Cập nhật DB
        if (taskId) {
          const { error } = await supabaseClient
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', taskId);
          if (error) {
            console.error('Không cập nhật được trạng thái:', error);
          }
        }
      },
    });
  });
}

// Xuất CSV
exportBtn.addEventListener('click', async () => {
  if (!currentUser) return;
  // Lấy tất cả công việc của người dùng (tạo hoặc được giao)
  const { data: tasks, error } = await supabaseClient
    .from('tasks')
    .select('*')
    .or(
      `assigned_email.eq.${currentUser.email},created_by_email.eq.${currentUser.email}`
    );
  if (error) {
    alert('Không thể tải danh sách công việc để xuất.');
    return;
  }
  // Chuyển sang CSV
  const headers = [
    'Tiêu đề',
    'Mô tả',
    'Hạn',
    'Trạng thái',
    'Người tạo',
    'Người được giao',
    'Ngày tạo',
  ];
  const rows = tasks.map((t) => [
    t.title,
    t.description || '',
    t.due_date || '',
    t.status,
    t.created_by_email || '',
    t.assigned_email || '',
    t.created_at || '',
  ]);
  const csvContent = [headers, ...rows]
    .map((r) => r.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'tasks.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});

// Lắng nghe thay đổi phiên
supabaseClient.auth.onAuthStateChange((_event, session) => {
  if (session && session.user) {
    currentUser = session.user;
    showApp();
  } else {
    currentUser = null;
    showAuth();
  }
});

// Bắt đầu kiểm tra phiên khi tải trang
checkSession();
