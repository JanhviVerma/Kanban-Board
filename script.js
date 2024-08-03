document.addEventListener('DOMContentLoaded', () => {
    const addTaskButtons = document.querySelectorAll('.add-task');
    const modal = document.getElementById('task-modal');
    const saveTaskButton = document.getElementById('save-task');
    const closeModalButton = document.getElementById('close-modal');
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
        const column = modal.dataset.column;

        if (title) {
            const taskElement = createTaskElement(title, description, priority, dueDate);
            const taskList = document.querySelector(`#${column} .task-list`);
            taskList.appendChild(taskElement);
            saveTasks();
            closeModal();
        }
    }

    function createTaskElement(title, description, priority, dueDate) {
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
        taskElement.appendChild(taskActions);

        taskElement.addEventListener('dragstart', dragStart);
        taskElement.addEventListener('dragend', dragEnd);

        return taskElement;
    }

    function editTask(taskElement) {
        // Implement edit functionality
    }

    function deleteTask(taskElement) {
        if (confirm('Are you sure you want to delete this task?')) {
            taskElement.remove();
            saveTasks();
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
                dueDate: task.querySelector('.task-due-date').textContent.replace('Due: ', '')
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
                    const taskElement = createTaskElement(task.title, task.description, task.priority, task.dueDate);
                    taskElement.id = task.id;
                    taskList.appendChild(taskElement);
                });
            });
            taskId = Math.max(...Object.values(savedTasks).flat().map(task => parseInt(task.id.split('-')[1]))) + 1;
        }
    }

    function clearModalInputs() {
        document.getElementById('task-title').value = '';
        document.getElementById('task-description').value = '';
        document.getElementById('task-priority').value = 'low';
        document.getElementById('task-due-date').value = '';
    }
});