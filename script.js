document.addEventListener('DOMContentLoaded', () => {
    const addTaskButtons = document.querySelectorAll('.add-task');
    
    addTaskButtons.forEach(button => {
        button.addEventListener('click', () => {
            const taskList = button.previousElementSibling;
            const taskText = prompt('Enter task description:');
            
            if (taskText) {
                const taskElement = document.createElement('div');
                taskElement.classList.add('task');
                taskElement.textContent = taskText;
                taskList.appendChild(taskElement);
            }
        });
    });
});