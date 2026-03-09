document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('studentDataForm');
    const successModal = document.getElementById('successModal');
    const closeModal = document.getElementById('closeModal');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Collect form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            console.log('Form Submitted:', data);

            // Show success modal
            if (successModal) {
                successModal.classList.remove('hidden');
            }
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            if (successModal) {
                successModal.classList.add('hidden');
            }
            // Optionally reset the form
            if (form) {
                form.reset();
            }
        });
    }

    // Close modal on outside click
    if (successModal) {
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                successModal.classList.add('hidden');
            }
        });
    }
});
