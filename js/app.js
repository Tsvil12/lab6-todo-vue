const { createApp, ref, computed, nextTick, onMounted, watch } = Vue;

createApp({
    setup() {
        // Состояние
        const tasks = ref([]);
        const newTaskTitle = ref('');
        const searchQuery = ref('');
        const currentFilter = ref('Все');
        const currentPage = ref(1);
        const tasksPerPage = 5;
        const editingTask = ref(null);
        const showDeleteModal = ref(false);
        const taskToDelete = ref(null);
        const isDarkTheme = ref(false);

        // Фильтры
        const filters = ['Все', 'Активные', 'Выполненные'];

        // Вычисляемые свойства
        const filteredTasks = computed(() => {
            let filtered = tasks.value;

            if (currentFilter.value === 'Активные') {
                filtered = filtered.filter(task => !task.completed);
            } else if (currentFilter.value === 'Выполненные') {
                filtered = filtered.filter(task => task.completed);
            }

            if (searchQuery.value.trim()) {
                filtered = filtered.filter(task => 
                    task.title.toLowerCase().includes(searchQuery.value.toLowerCase())
                );
            }

            return filtered;
        });

        const totalPages = computed(() => {
            return Math.ceil(filteredTasks.value.length / tasksPerPage) || 1;
        });

        const paginatedTasks = computed(() => {
            const start = (currentPage.value - 1) * tasksPerPage;
            const end = start + tasksPerPage;
            return filteredTasks.value.slice(start, end);
        });

        const completedCount = computed(() => {
            return tasks.value.filter(task => task.completed).length;
        });

        // Методы
        const generateId = () => {
            return Date.now() + Math.random().toString(36).substr(2, 8);
        };

        const addTask = () => {
            if (!newTaskTitle.value.trim()) return;
            
            const newTask = {
                id: generateId(),
                title: newTaskTitle.value.trim(),
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            tasks.value.unshift(newTask);
            newTaskTitle.value = '';
            currentPage.value = 1;
        };

        const startEdit = (task) => {
            editingTask.value = { ...task };
            nextTick(() => {
                const input = document.querySelector('.edit-input');
                if (input) input.focus();
            });
        };

        const saveEdit = () => {
            if (!editingTask.value || !editingTask.value.title.trim()) {
                cancelEdit();
                return;
            }
            
            const index = tasks.value.findIndex(t => t.id === editingTask.value.id);
            if (index !== -1) {
                tasks.value[index].title = editingTask.value.title.trim();
            }
            
            cancelEdit();
        };

        const cancelEdit = () => {
            editingTask.value = null;
        };

        const confirmDelete = (task) => {
            taskToDelete.value = task;
            showDeleteModal.value = true;
        };

        const deleteTask = () => {
            if (taskToDelete.value) {
                const index = tasks.value.findIndex(t => t.id === taskToDelete.value.id);
                if (index !== -1) {
                    tasks.value.splice(index, 1);
                }
                
                if (paginatedTasks.value.length === 1 && currentPage.value > 1) {
                    currentPage.value--;
                }
            }
            closeDeleteModal();
        };

        const closeDeleteModal = () => {
            showDeleteModal.value = false;
            taskToDelete.value = null;
        };

        const toggleTheme = () => {
            isDarkTheme.value = !isDarkTheme.value;
            updateBodyTheme();
        };

        const updateBodyTheme = () => {
            if (isDarkTheme.value) {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }
        };

        // Сохранение в localStorage
        const saveToLocalStorage = () => {
            localStorage.setItem('todo-tasks', JSON.stringify(tasks.value));
            localStorage.setItem('todo-theme', JSON.stringify(isDarkTheme.value));
        };

        const loadFromLocalStorage = () => {
            const savedTasks = localStorage.getItem('todo-tasks');
            if (savedTasks) {
                tasks.value = JSON.parse(savedTasks);
            } else {
                tasks.value = [
                    { id: generateId(), title: 'Изучить Vue 3', completed: false, createdAt: new Date().toISOString() },
                    { id: generateId(), title: 'Сделать To-Do List', completed: true, createdAt: new Date().toISOString() },
                    { id: generateId(), title: 'Добавить тёмную тему', completed: false, createdAt: new Date().toISOString() }
                ];
            }
            
            const savedTheme = localStorage.getItem('todo-theme');
            if (savedTheme) {
                isDarkTheme.value = JSON.parse(savedTheme);
                updateBodyTheme();
            }
        };

        watch(tasks, () => {
            saveToLocalStorage();
        }, { deep: true });
        
        watch(isDarkTheme, () => {
            saveToLocalStorage();
        });

        watch([searchQuery, currentFilter], () => {
            currentPage.value = 1;
        });

        onMounted(() => {
            loadFromLocalStorage();
        });

        return {
            tasks,
            newTaskTitle,
            searchQuery,
            currentFilter,
            currentPage,
            editingTask,
            showDeleteModal,
            taskToDelete,
            isDarkTheme,
            filters,
            filteredTasks,
            totalPages,
            paginatedTasks,
            completedCount,
            addTask,
            startEdit,
            saveEdit,
            cancelEdit,
            confirmDelete,
            deleteTask,
            closeDeleteModal,
            toggleTheme
        };
    }
}).mount('#app');