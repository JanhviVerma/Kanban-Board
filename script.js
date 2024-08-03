document.addEventListener('DOMContentLoaded', () => {
    const addTaskButtons = document.querySelectorAll('.add-task');
    const modal = document.getElementById('task-modal');
    const saveTaskButton = document.getElementById('save-task');
    const closeModalButton = document.getElementById('close-modal');
    const filterPriority = document.getElementById('filter-priority');
    const sortTasks = document.getElementById('sort-tasks');
    const showAnalyticsButton = document.getElementById('show-analytics');
    const analyticsModal = document.getElementById('analytics-modal');
    const closeAnalyticsButton = document.getElementById('close-analytics');
    const exportTasksButton = document.getElementById('export-tasks');
    let taskId = 0;
    
    loadTasks();

    addTaskButtons.forEach(button => {
        button.addEventListener('click', () => {
            const column = button.closest('.column').id;
            openModal(column);
        });
    });

    saveTaskButton.addEventListener('click', saveTask);
    closeModalButton.addEventListener('click', closeModal);
    filterPriority.addEventListener('change', applyFiltersAndSort);
    sortTasks.addEventListener('change', applyFiltersAndSort);
    showAnalyticsButton.addEventListener('click', showAnalytics);
    closeAnalyticsButton.addEventListener('click', closeAnalytics);
    exportTasksButton.addEventListener('click', exportTasks);

    function openModal(column) {
        modal.style.display = 'block';
        modal.dataset.column = column;
    }

    function closeModal() {
        modal.style.display = 'none';
        clearModalInputs();
    }

    function saveTask() {
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const priority = document.getElementById('task-priority').value;
        const dueDate = document.getElementById('task-due-date').value;
        const tags = document.getElementById('task-tags').value.split(',').map(tag => tag.trim());
        const column = modal.dataset.column;

        if (title) {
            const taskElement = createTaskElement(title, description, priority, dueDate, tags);
            const taskList = document.querySelector(`#${column} .task-list`);
            taskList.appendChild(taskElement);
            saveTasks();
            closeModal();
            applyFiltersAndSort();
        }
    }

    function createTaskElement(title, description, priority, dueDate, tags) {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task');
        taskElement.setAttribute('draggable', 'true');
        taskElement.id = `task-${taskId++}`;
        
        const taskPriority = document.createElement('div');
        taskPriority.classList.add('task-priority', priority);
        taskPriority.textContent = `Priority: ${priority}`;
        
        const taskTitle = document.createElement('h3');
        taskTitle.textContent = title;
        
        const taskDescription = document.createElement('p');
        taskDescription.textContent = description;
        
        const taskDueDate = document.createElement('div');
        taskDueDate.classList.add('task-due-date');
        taskDueDate.textContent = `Due: ${dueDate || 'Not set'}`;
        
        const taskTags = document.createElement('div');
        taskTags.classList.add('task-tags');
        tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.classList.add('task-tag');
            tagElement.textContent = tag;
            taskTags.appendChild(tagElement);
        });
        
        const taskActions = document.createElement('div');
        taskActions.classList.add('task-actions');
        
        const editIcon = document.createElement('i');
        editIcon.classList.add('fas', 'fa-edit');
        editIcon.addEventListener('click', () => editTask(taskElement));
        
        const deleteIcon = document.createElement('i');
        deleteIcon.classList.add('fas', 'fa-trash-alt');
        deleteIcon.addEventListener('click', () => deleteTask(taskElement));
        
        taskActions.appendChild(editIcon);
        taskActions.appendChild(deleteIcon);
        
        taskElement.appendChild(taskPriority);
        taskElement.appendChild(taskTitle);
        taskElement.appendChild(taskDescription);
        taskElement.appendChild(taskDueDate);
        taskElement.appendChild(taskTags);
        taskElement.appendChild(taskActions);

        taskElement.addEventListener('dragstart', dragStart);
        taskElement.addEventListener('dragend', dragEnd);

        return taskElement;
    }

    function editTask(taskElement) {
        const title = taskElement.querySelector('h3').textContent;
        const description = taskElement.querySelector('p').textContent;
        const priority = taskElement.querySelector('.task-priority').classList[1];
        const dueDate = taskElement.querySelector('.task-due-date').textContent.replace('Due: ', '');
        const tags = Array.from(taskElement.querySelectorAll('.task-tag')).map(tag => tag.textContent).join(', ');

        document.getElementById('task-title').value = title;
        document.getElementById('task-description').value = description;
        document.getElementById('task-priority').value = priority;
        document.getElementById('task-due-date').value = dueDate !== 'Not set' ? dueDate : '';
        document.getElementById('task-tags').value = tags;

        openModal(taskElement.closest('.column').id);
        saveTaskButton.onclick = function() {
            updateTask(taskElement);
            saveTaskButton.onclick = saveTask;
        };
    }

    function updateTask(taskElement) {
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const priority = document.getElementById('task-priority').value;
        const dueDate = document.getElementById('task-due-date').value;
        const tags = document.getElementById('task-tags').value.split(',').map(tag => tag.trim());

        taskElement.querySelector('h3').textContent = title;
        taskElement.querySelector('p').textContent = description;
        taskElement.querySelector('.task-priority').className = `task-priority ${priority}`;
        taskElement.querySelector('.task-priority').textContent = `Priority: ${priority}`;
        taskElement.querySelector('.task-due-date').textContent = `Due: ${dueDate || 'Not set'}`;

        const taskTags = taskElement.querySelector('.task-tags');
        taskTags.innerHTML = '';
        tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.classList.add('task-tag');
            tagElement.textContent = tag;
            taskTags.appendChild(tagElement);
        });

        closeModal();
        saveTasks();
        applyFiltersAndSort();
    }

    function deleteTask(taskElement) {
        if (confirm('Are you sure you want to delete this task?')) {
            taskElement.remove();
            saveTasks();
            applyFiltersAndSort();
        }
    }

    function dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.id);
        setTimeout(() => {
            e.target.style.opacity = '0.5';
        }, 0);
    }

    function dragEnd(e) {
        e.target.style.opacity = '1';
    }

    const taskLists = document.querySelectorAll('.task-list');
    taskLists.forEach(taskList => {
        taskList.addEventListener('dragover', dragOver);
        taskList.addEventListener('dragenter', dragEnter);
        taskList.addEventListener('dragleave', dragLeave);
        taskList.addEventListener('drop', drop);
    });

    function dragOver(e) {
        e.preventDefault();
    }

    function dragEnter(e) {
        e.preventDefault();
        if (e.target.classList.contains('task-list')) {
            e.target.classList.add('drag-over');
        }
    }

    function dragLeave(e) {
        if (e.target.classList.contains('task-list')) {
            e.target.classList.remove('drag-over');
        }
    }

    function drop(e) {
        const taskList = e.target.closest('.task-list');
        taskList.classList.remove('drag-over');

        const id = e.dataTransfer.getData('text/plain');
        const draggable = document.getElementById(id);

        taskList.appendChild(draggable);
        draggable.style.opacity = '1';
        saveTasks();
        applyFiltersAndSort();
    }

    function saveTasks() {
        const columns = ['todo', 'in-progress', 'done'];
        const tasks = {};

        columns.forEach(column => {
            const taskList = document.querySelector(`#${column} .task-list`);
            tasks[column] = Array.from(taskList.children).map(task => ({
                id: task.id,
                title: task.querySelector('h3').textContent,
                description: task.querySelector('p').textContent,
                priority: task.querySelector('.task-priority').classList[1],
                dueDate: task.querySelector('.task-due-date').textContent.replace('Due: ', ''),
                tags: Array.from(task.querySelectorAll('.task-tag')).map(tag => tag.textContent)
            }));
        });

        localStorage.setItem('kanbanTasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const savedTasks = JSON.parse(localStorage.getItem('kanbanTasks'));
        if (savedTasks) {
            Object.entries(savedTasks).forEach(([column, tasks]) => {
                const taskList = document.querySelector(`#${column} .task-list`);
                tasks.forEach(task => {
                    const taskElement = createTaskElement(task.title, task.description, task.priority, task.dueDate, task.tags);
                    taskElement.id = task.id;
                    taskList.appendChild(taskElement);
                });
            });
            taskId = Math.max(...Object.values(savedTasks).flat().map(task => parseInt(task.id.split('-')[1]))) + 1;
        }
        applyFiltersAndSort();
    }

    function clearModalInputs() {
        document.getElementById('task-title').value = '';
        document.getElementById('task-description').value = '';
        document.getElementById('task-priority').value = 'low';
        document.getElementById('task-due-date').value = '';
        document.getElementById('task-tags').value = '';
    }

    function applyFiltersAndSort() {
        const priority = filterPriority.value;
        const sortBy = sortTasks.value;
        const tasks = document.querySelectorAll('.task');

        tasks.forEach(task => {
            const taskPriority = task.querySelector('.task-priority').classList[1];
            task.style.display = (priority === 'all' || taskPriority === priority) ? 'block' : 'none';
        });

        const taskLists = document.querySelectorAll('.task-list');
        taskLists.forEach(taskList => {
            const tasksArray = Array.from(taskList.children);
            tasksArray.sort((a, b) => {
                if (sortBy === 'priority') {
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.querySelector('.task-priority').classList[1]] - priorityOrder[a.querySelector('.task-priority').classList[1]];
                } else if (sortBy === 'dueDate') {
                    const dateA = new Date(a.querySelector('.task-due-date').textContent.replace('Due: ', ''));
                    const dateB = new Date(b.querySelector('.task-due-date').textContent.replace('Due: ', ''));
                    return dateA - dateB;
                } else {
                    return a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent);
                }
            });
            tasksArray.forEach(task => taskList.appendChild(task));
        });
    }

    function showAnalytics() {
        const tasks = document.querySelectorAll('.task');
        const totalTasks = tasks.length;
        const priorities = { low: 0, medium: 0, high: 0 };
        const statuses = { todo: 0, 'in-progress': 0, done: 0 };
        const tags = {};

        tasks.forEach(task => {
            const priority = task.querySelector('.task-priority').classList[1];
            const status = task.closest('.column').id;
            priorities[priority]++;
            statuses[status]++;

            const taskTags = task.querySelectorAll('.task-tag');
            taskTags.forEach(tag => {
                const tagText = tag.textContent;
                tags[tagText] = (tags[tagText] || 0) + 1;
            });
        });

        const analyticsContent = document.getElementById('analytics-content');
        analyticsContent.innerHTML = `
            <div>Total Tasks: ${totalTasks}</div>
            <div>Priorities: Low (${priorities.low}), Medium (${priorities.medium}), High (${priorities.high})</div>
            <div>Statuses: To Do (${statuses.todo}), In Progress (${statuses['in-progress']}), Done (${statuses.done})</div>
            <div>Top Tags: ${Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag, count]) => `${tag} (${count})`).join(', ')}</div>
        `;

        const ctx = document.getElementById('task-chart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['To Do', 'In Progress', 'Done'],
                datasets: [{
                    label: 'Tasks by Status',
                    data: [statuses.todo, statuses['in-progress'], statuses.done],
                    backgroundColor: ['#FFD700', '#FFA500', '#4CAF50']
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        stepSize: 1
                    }
                }
            }
        });

        analyticsModal.style.display = 'block';
    }

    function closeAnalytics() {
        analyticsModal.style.display = 'none';
    }

    function exportTasks() {
        const tasks = JSON.parse(localStorage.getItem('kanbanTasks'));
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Title,Description,Priority,Due Date,Status,Tags\n"
            + Object.entries(tasks).flatMap(([status, taskList]) => 
                taskList.map(task => 
                    `"${task.title}","${task.description}",${task.priority},${task.dueDate},${status},"${task.tags.join(', ')}"`
                )
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "kanban_tasks.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});