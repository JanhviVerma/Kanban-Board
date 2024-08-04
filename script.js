document.addEventListener('DOMContentLoaded', () => {
    const addTaskButtons = document.querySelectorAll('.add-task');
    const modal = document.getElementById('task-modal');
    const saveTaskButton = document.getElementById('save-task');
    const closeModalButton = document.getElementById('close-modal');
    const filterPriority = document.getElementById('filter-priority');
    const sortTasks = document.getElementById('sort-tasks');
    const searchTasks = document.getElementById('search-tasks');
    const filterCategory = document.getElementById('filter-category');
    const filterCompletion = document.getElementById('filter-completion');
    const showAnalyticsButton = document.getElementById('show-analytics');
    const analyticsModal = document.getElementById('analytics-modal');
    const closeAnalyticsButton = document.getElementById('close-analytics');
    const exportTasksButton = document.getElementById('export-tasks');
    const importTasksButton = document.getElementById('import-tasks');
    const importFile = document.getElementById('import-file');
    const addSubtaskButton = document.getElementById('add-subtask');
    const addCommentButton = document.getElementById('add-comment');
    let taskId = 0;
    let draggedTask = null;
    let touchStartX, touchStartY;
    const showArchivedButton = document.getElementById('show-archived');
    const archivedTasksModal = document.getElementById('archived-tasks');
    const closeArchivedButton = document.getElementById('close-archived');
    const archivedTaskList = document.getElementById('archived-task-list');

    let archivedTasks = [];
    
    loadTasks();    

    function initializeEventListeners() {
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
        searchTasks.addEventListener('input', applyFiltersAndSort);
        filterCategory.addEventListener('change', applyFiltersAndSort);
        filterCompletion.addEventListener('change', applyFiltersAndSort);
        showAnalyticsButton.addEventListener('click', showAnalytics);
        closeAnalyticsButton.addEventListener('click', closeAnalytics);
        exportTasksButton.addEventListener('click', exportTasks);
        importTasksButton.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', importTasks);
        addSubtaskButton.addEventListener('click', addSubtask);
        addCommentButton.addEventListener('click', addComment);

        initializeMobileDragAndDrop();

        showArchivedButton.addEventListener('click', showArchivedTasks);
        closeArchivedButton.addEventListener('click', closeArchivedTasks);
    }

    // Add these new functions and event listeners for mobile drag and drop
    

    function initializeMobileDragAndDrop() {
        const tasks = document.querySelectorAll('.task');
        const columns = document.querySelectorAll('.column');

        tasks.forEach(task => {
            task.addEventListener('touchstart', touchStart, { passive: false });
            task.addEventListener('touchmove', touchMove, { passive: false });
            task.addEventListener('touchend', touchEnd);
        });

        columns.forEach(column => {
            column.addEventListener('touchmove', columnTouchMove, { passive: false });
        });
    }

    function touchStart(e) {
        draggedTask = e.target.closest('.task');
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;

        setTimeout(() => {
            draggedTask.classList.add('dragging');
        }, 100);
    }

    function touchMove(e) {
        if (!draggedTask) return;
        e.preventDefault();

        const touch = e.touches[0];
        const moveX = touch.clientX - touchStartX;
        const moveY = touch.clientY - touchStartY;

        draggedTask.style.transform = `translate(${moveX}px, ${moveY}px)`;
    }

    function columnTouchMove(e) {
        if (!draggedTask) return;
        e.preventDefault();

        const touch = e.touches[0];
        const column = document.elementFromPoint(touch.clientX, touch.clientY).closest('.column');

        if (column) {
            const taskList = column.querySelector('.task-list');
            const rect = taskList.getBoundingClientRect();
            const middleY = rect.top + rect.height / 2;

            if (touch.clientY < middleY) {
                taskList.insertBefore(draggedTask, taskList.firstChild);
            } else {
                taskList.appendChild(draggedTask);
            }
        }
    }

    function touchEnd() {
        if (!draggedTask) return;

        draggedTask.classList.remove('dragging');
        draggedTask.style.transform = '';
        draggedTask = null;

        saveTasks();
        applyFiltersAndSort();
    }

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
        const attachment = document.getElementById('task-attachment').files[0];
        const completion = document.getElementById('task-completion').value;
        const category = document.getElementById('task-category').value;
        const column = modal.dataset.column;
        const subtasks = Array.from(document.getElementById('subtasks-list').children).map(li => li.textContent);
        const comments = Array.from(document.getElementById('comments-list').children).map(li => li.textContent);

        if (title) {
            const taskElement = createTaskElement(title, description, priority, dueDate, tags, attachment, completion, category, subtasks, comments);
            const taskList = document.querySelector(`#${column} .task-list`);
            if (taskList) {
                taskList.appendChild(taskElement);
                saveTasks();
                closeModal();
                applyFiltersAndSort();
            } else {
                console.error('Could not find task list for column:', column);
            }
        } else {
            alert('Please enter a task title.');
        }
    }

    function createTaskElement(title, description, priority, dueDate, tags, attachment, completion, category, subtasks, comments) {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task');
        taskElement.setAttribute('draggable', 'true');
        taskElement.id = `task-${taskId++}`;
        const archiveIcon = document.createElement('i');
        archiveIcon.classList.add('fas', 'fa-archive', 'archive-task');
        archiveIcon.addEventListener('click', () => archiveTask(taskElement));

        taskActions.appendChild(archiveIcon);
        
        taskElement.innerHTML = `
            <div class="task-priority ${priority}">${priority}</div>
            <h3>${title}</h3>
            <p>${description}</p>
            <div class="task-due-date">Due: ${dueDate || 'Not set'}</div>
            <div class="task-completion">Completion: ${completion}%</div>
            <div class="task-category">Category: ${category}</div>
            <div class="task-tags">${tags.map(tag => `<span class="task-tag">${tag}</span>`).join('')}</div>
            ${attachment ? `<div class="task-attachment">Attachment: ${attachment.name}</div>` : ''}
            <div class="task-subtasks">
                <h4>Subtasks:</h4>
                <ul>${subtasks.map(subtask => `<li>${subtask}</li>`).join('')}</ul>
            </div>
            <div class="task-comments">
                <h4>Comments:</h4>
                <ul>${comments.map(comment => `<li>${comment}</li>`).join('')}</ul>
            </div>
        `;
    
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
        
        taskElement.appendChild(taskActions);
    
        taskElement.addEventListener('dragstart', dragStart);
        taskElement.addEventListener('dragend', dragEnd);
        taskElement.addEventListener('touchstart', touchStart, { passive: false });
        taskElement.addEventListener('touchmove', touchMove, { passive: false });
        taskElement.addEventListener('touchend', touchEnd);

    
        console.log('Created task element:', taskElement);
    
        return taskElement;
    }

    function archiveTask(taskElement) {
        const taskData = {
            id: taskElement.id,
            title: taskElement.querySelector('h3').textContent,
            description: taskElement.querySelector('p').textContent,
            priority: taskElement.querySelector('.task-priority').classList[1],
            dueDate: taskElement.querySelector('.task-due-date').textContent.replace('Due: ', ''),
            tags: Array.from(taskElement.querySelectorAll('.task-tag')).map(tag => tag.textContent),
            completion: taskElement.querySelector('.task-completion').textContent.replace('Completion: ', '').replace('%', ''),
            category: taskElement.querySelector('.task-category').textContent.replace('Category: ', ''),
            column: taskElement.closest('.column').id
        };

        archivedTasks.push(taskData);
        taskElement.remove();
        saveTasks();
        saveArchivedTasks();
    }

    function showArchivedTasks() {
        archivedTaskList.innerHTML = '';
        archivedTasks.forEach(task => {
            const archivedTaskElement = document.createElement('div');
            archivedTaskElement.classList.add('archived-task');
            archivedTaskElement.innerHTML = `
                <div>
                    <strong>${task.title}</strong> (${task.priority})
                    <br>
                    Due: ${task.dueDate}, Completion: ${task.completion}%
                </div>
                <button class="restore-task" data-id="${task.id}">Restore</button>
            `;
            archivedTaskList.appendChild(archivedTaskElement);
        });

        const restoreButtons = archivedTaskList.querySelectorAll('.restore-task');
        restoreButtons.forEach(button => {
            button.addEventListener('click', () => restoreTask(button.dataset.id));
        });

        archivedTasksModal.style.display = 'block';
    }

    function closeArchivedTasks() {
        archivedTasksModal.style.display = 'none';
    }

    function restoreTask(taskId) {
        const taskIndex = archivedTasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            const task = archivedTasks[taskIndex];
            const taskElement = createTaskElement(
                task.title,
                task.description,
                task.priority,
                task.dueDate,
                task.tags,
                null,
                task.completion,
                task.category,
                [],
                []
            );
            taskElement.id = task.id;

            const column = document.getElementById(task.column);
            const taskList = column.querySelector('.task-list');
            taskList.appendChild(taskElement);

            archivedTasks.splice(taskIndex, 1);
            saveTasks();
            saveArchivedTasks();
            showArchivedTasks(); // Refresh the archived tasks list
        }
    }

    function saveArchivedTasks() {
        localStorage.setItem('archivedTasks', JSON.stringify(archivedTasks));
    }

    function loadArchivedTasks() {
        const savedArchivedTasks = JSON.parse(localStorage.getItem('archivedTasks'));
        if (savedArchivedTasks) {
            archivedTasks = savedArchivedTasks;
        }
    }

    function clearModalInputs() {
        document.getElementById('task-title').value = '';
        document.getElementById('task-description').value = '';
        document.getElementById('task-priority').value = 'low';
        document.getElementById('task-due-date').value = '';
        document.getElementById('task-tags').value = '';
        document.getElementById('task-attachment').value = '';
        document.getElementById('task-completion').value = '';
        document.getElementById('task-category').value = 'work';
        document.getElementById('subtasks-list').innerHTML = '';
        document.getElementById('comments-list').innerHTML = '';
        document.getElementById('new-subtask').value = '';
        document.getElementById('new-comment').value = '';
    }

    function addSubtask() {
        const newSubtaskInput = document.getElementById('new-subtask');
        const subtasksList = document.getElementById('subtasks-list');
        if (newSubtaskInput.value.trim()) {
            const li = document.createElement('li');
            li.textContent = newSubtaskInput.value.trim();
            subtasksList.appendChild(li);
            newSubtaskInput.value = '';
        }
    }

    function addComment() {
        const newCommentInput = document.getElementById('new-comment');
        const commentsList = document.getElementById('comments-list');
        if (newCommentInput.value.trim()) {
            const li = document.createElement('li');
            li.textContent = newCommentInput.value.trim();
            commentsList.appendChild(li);
            newCommentInput.value = '';
        }
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
                completion: task.querySelector('.task-completion').textContent.replace('Completion: ', '').replace('%', ''),
                category: task.querySelector('.task-category').textContent.replace('Category: ', ''),
                tags: Array.from(task.querySelectorAll('.task-tag')).map(tag => tag.textContent),
                subtasks: Array.from(task.querySelectorAll('.task-subtasks li')).map(li => li.textContent),
                comments: Array.from(task.querySelectorAll('.task-comments li')).map(li => li.textContent),
            }));
        });
    
        localStorage.setItem('kanbanTasks', JSON.stringify(tasks));
        console.log('Tasks saved:', tasks);
    }

    function editTask(taskElement) {
        const title = taskElement.querySelector('h3').textContent;
        const description = taskElement.querySelector('p').textContent;
        const priority = taskElement.classList[1].replace('-priority', '');
        const dueDate = taskElement.querySelector('.task-due-date').textContent.replace('Due: ', '');
        const tags = Array.from(taskElement.querySelectorAll('.task-tag')).map(tag => tag.textContent).join(', ');
        const completion = parseInt(taskElement.querySelector('.task-completion-bar').style.width);
        const category = taskElement.querySelector('.task-category').textContent.replace('Category: ', '');
    
        document.getElementById('task-title').value = title;
        document.getElementById('task-description').value = description;
        document.getElementById('task-priority').value = priority;
        document.getElementById('task-due-date').value = dueDate !== 'Not set' ? dueDate : '';
        document.getElementById('task-tags').value = tags;
        document.getElementById('task-completion').value = completion;
        document.getElementById('task-category').value = category;
    
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
        const completion = document.getElementById('task-completion').value;
        const category = document.getElementById('task-category').value;
        const attachment = document.getElementById('task-attachment').files[0];
    
        taskElement.className = `task ${priority}-priority`;
        taskElement.querySelector('h3').textContent = title;
        taskElement.querySelector('p').textContent = description;
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
    
        const taskAttachment = taskElement.querySelector('.task-attachment');
        if (attachment) {
            taskAttachment.textContent = `Attachment: ${attachment.name}`;
        } else {
            taskAttachment.textContent = '';
        }
    
        taskElement.querySelector('.task-completion-bar').style.width = `${completion}%`;
        taskElement.querySelector('.task-category').textContent = `Category: ${category}`;
    
        closeModal();
        saveTasks();
        applyFiltersAndSort();
    }

    function updateTask(taskElement) {
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const priority = document.getElementById('task-priority').value;
        const dueDate = document.getElementById('task-due-date').value;
        const tags = document.getElementById('task-tags').value.split(',').map(tag => tag.trim());
        const attachment = document.getElementById('task-attachment').files[0];

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

        const taskAttachment = taskElement.querySelector('.task-attachment');
        if (attachment) {
            taskAttachment.textContent = `Attachment: ${attachment.name}`;
        } else {
            taskAttachment.textContent = '';
        }

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

    function loadTasks() {
        const savedTasks = JSON.parse(localStorage.getItem('kanbanTasks'));
        if (savedTasks) {
            Object.entries(savedTasks).forEach(([column, tasks]) => {
                const taskList = document.querySelector(`#${column} .task-list`);
                tasks.forEach(task => {
                    const taskElement = createTaskElement(
                        task.title,
                        task.description,
                        task.priority,
                        task.dueDate,
                        task.tags,
                        { name: task.attachment },
                        task.completion,
                        task.category,
                        task.subtasks || [],
                        task.comments || []
                    );
                    taskElement.id = task.id;
                    taskList.appendChild(taskElement);
                });
            });
            taskId = Math.max(...Object.values(savedTasks).flat().map(task => parseInt(task.id.split('-')[1]))) + 1;
        }
        applyFiltersAndSort();
        initializeEventListeners();
        loadArchivedTasks();
        initializeEventListeners();
    }

    function clearModalInputs() {
        document.getElementById('task-title').value = '';
        document.getElementById('task-description').value = '';
        document.getElementById('task-priority').value = 'low';
        document.getElementById('task-due-date').value = '';
        document.getElementById('task-tags').value = '';
        document.getElementById('task-attachment').value = '';
    }

    function applyFiltersAndSort() {
        const priority = filterPriority.value;
        const sortBy = sortTasks.value;
        const searchQuery = searchTasks.value.toLowerCase();
        const category = document.getElementById('filter-category').value;
        const completion = document.getElementById('filter-completion').value;
        const tasks = document.querySelectorAll('.task');
    
        tasks.forEach(task => {
            const taskPriority = task.querySelector('.task-priority').classList[1];
            const taskTitle = task.querySelector('h3').textContent.toLowerCase();
            const taskDescription = task.querySelector('p').textContent.toLowerCase();
            const taskTags = Array.from(task.querySelectorAll('.task-tag')).map(tag => tag.textContent.toLowerCase());
            const taskCategory = task.querySelector('.task-category').textContent.split(': ')[1];
            const taskCompletionElement = task.querySelector('.task-completion');
            const taskCompletion = taskCompletionElement ? parseInt(taskCompletionElement.textContent.split(': ')[1]) : 0;
    
            const priorityMatch = priority === 'all' || taskPriority === priority;
            const categoryMatch = category === 'all' || taskCategory === category;
            const completionMatch = completion === 'all' || 
                                    (completion === 'incomplete' && taskCompletion < 100) ||
                                    (completion === 'complete' && taskCompletion === 100);
            const searchMatch = taskTitle.includes(searchQuery) || 
                                taskDescription.includes(searchQuery) || 
                                taskTags.some(tag => tag.includes(searchQuery));
    
            task.style.display = (priorityMatch && categoryMatch && completionMatch && searchMatch) ? 'block' : 'none';
        });
    
        const taskLists = document.querySelectorAll('.task-list');
        taskLists.forEach(taskList => {
            const tasksArray = Array.from(taskList.children).filter(task => task.style.display !== 'none');
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
        const categories = { work: 0, personal: 0, education: 0, other: 0 };
        const completionRate = { total: 0, count: 0 };

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

            const category = task.querySelector('.task-category').textContent.split(': ')[1];
            categories[category]++;
            
            const completion = parseInt(task.querySelector('.task-completion-bar').style.width);
            completionRate.total += completion;
            completionRate.count++;
        });

        const avgCompletionRate = completionRate.count > 0 ? (completionRate.total / completionRate.count).toFixed(2) : 0;
    
        analyticsContent.innerHTML += `
            <div>Categories: Work (${categories.work}), Personal (${categories.personal}), Education (${categories.education}), Other (${categories.other})</div>
            <div>Average Completion Rate: ${avgCompletionRate}%</div>
        `;

        const analyticsContent = document.getElementById('analytics-content');
        analyticsContent.innerHTML = `
            <div>Total Tasks: ${totalTasks}</div>
            <div>Priorities: Low (${priorities.low}), Medium (${priorities.medium}), High (${priorities.high})</div>
            <div>Statuses: To Do (${statuses.todo}), In Progress (${statuses['in-progress']}), Done (${statuses.done})</div>
            <div>Top Tags: ${Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag, count]) => `${tag} (${count})`).join(', ')}</div>
        `;

        const taskCtx = document.getElementById('task-chart').getContext('2d');
        new Chart(taskCtx, {
            type: 'bar',
            data: {
                labels: ['To Do', 'In Progress', 'Done'],
                datasets: [{
                    label: 'Tasks by Status',
                    data: [statuses.todo, statuses['in-progress'], statuses.done],
                    backgroundColor: ['#4a90e2', '#f39c12', '#2ecc71']
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

        const priorityCtx = document.getElementById('priority-chart').getContext('2d');
        new Chart(priorityCtx, {
            type: 'pie',
            data: {
                labels: ['Low', 'Medium', 'High'],
                datasets: [{
                    data: [priorities.low, priorities.medium, priorities.high],
                    backgroundColor: ['#2ecc71', '#f39c12', '#e74c3c']
                }]
            }
        });

        analyticsModal.style.display = 'block';

        const categoryCtx = document.getElementById('category-chart').getContext('2d');
        new Chart(categoryCtx, {
            type: 'pie',
            data: {
                labels: ['Work', 'Personal', 'Education', 'Other'],
                datasets: [{
                    data: [categories.work, categories.personal, categories.education, categories.other],
                    backgroundColor: ['#4a90e2', '#f39c12', '#2ecc71', '#e74c3c']
                }]
            }
        });

        analyticsModal.style.display = 'block';
    }

    function closeAnalytics() {
        analyticsModal.style.display = 'none';
    }

    function exportTasks() {
        const tasks = JSON.parse(localStorage.getItem('kanbanTasks'));
        const jsonString = JSON.stringify(tasks, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'kanban_tasks.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importTasks(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const tasks = JSON.parse(e.target.result);
                    localStorage.setItem('kanbanTasks', JSON.stringify(tasks));
                    location.reload();
                } catch (error) {
                    alert('Error importing tasks. Please make sure the file is a valid JSON.');
                }
            };
            reader.readAsText(file);
        }
    }

    function touchStart(e) {
        draggedTask = e.target.closest('.task');
        e.target.closest('.task').style.opacity = '0.5';
    }

    function touchMove(e) {
        e.preventDefault();
        const touch = e.targetTouches[0];
        const column = document.elementFromPoint(touch.pageX, touch.pageY).closest('.column');
        if (column) {
            column.classList.add('drag-over');
        }
    }

    function touchEnd(e) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const column = document.elementFromPoint(touch.pageX, touch.pageY).closest('.column');
        if (column) {
            column.classList.remove('drag-over');
            const taskList = column.querySelector('.task-list');
            taskList.appendChild(draggedTask);
            draggedTask.style.opacity = '1';
            saveTasks();
            applyFiltersAndSort();
        }
        draggedTask = null;
    }

    function addSubtask() {
        const subtaskInput = document.getElementById('new-subtask');
        const subtaskText = subtaskInput.value.trim();
        if (subtaskText) {
            const subtasksList = document.getElementById('subtasks-list');
            const li = document.createElement('li');
            li.innerHTML = `
                <input type="checkbox">
                <span>${subtaskText}</span>
                <button class="delete-subtask">Delete</button>
            `;
            subtasksList.appendChild(li);
            subtaskInput.value = '';
        }
    }

    function addComment() {
        const commentInput = document.getElementById('new-comment');
        const commentText = commentInput.value.trim();
        if (commentText) {
            const commentsList = document.getElementById('comments-list');
            const li = document.createElement('li');
            li.textContent = commentText;
            commentsList.appendChild(li);
            commentInput.value = '';
        }
    }

    function checkDueDates() {
        const tasks = document.querySelectorAll('.task');
        const today = new Date();
        tasks.forEach(task => {
            const dueDateElement = task.querySelector('.task-due-date');
            const dueDate = new Date(dueDateElement.textContent.replace('Due: ', ''));
            const timeDiff = dueDate.getTime() - today.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            task.classList.remove('due-soon', 'overdue');
            if (daysDiff <= 3 && daysDiff > 0) {
                task.classList.add('due-soon');
            } else if (daysDiff <= 0) {
                task.classList.add('overdue');
            }
        });
    }

    initializeEventListeners();
    loadTasks();
});

