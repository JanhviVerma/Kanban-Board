document.addEventListener('DOMContentLoaded', () => {
    const addTaskButtons = document.querySelectorAll('.add-task');
    let taskId = 0;
    
    addTaskButtons.forEach(button => {
        button.addEventListener('click', () => {
            const taskList = button.previousElementSibling;
            const taskText = prompt('Enter task description:');
            
            if (taskText) {
                const taskElement = createTaskElement(taskText);
                taskList.appendChild(taskElement);
            }
        });
    });

    function createTaskElement(taskText) {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task');
        taskElement.setAttribute('draggable', 'true');
        taskElement.id = `task-${taskId++}`;
        
        const taskContent = document.createElement('p');
        taskContent.textContent = taskText;
        
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
        
        taskElement.appendChild(taskContent);
        taskElement.appendChild(taskActions);

        taskElement.addEventListener('dragstart', dragStart);
        taskElement.addEventListener('dragend', dragEnd);

        return taskElement;
    }

    function editTask(taskElement) {
        const taskContent = taskElement.querySelector('p');
        const newText = prompt('Edit task:', taskContent.textContent);
        if (newText !== null) {
            taskContent.textContent = newText;
        }
    }

    function deleteTask(taskElement) {
        if (confirm('Are you sure you want to delete this task?')) {
            taskElement.remove();
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
    }
});