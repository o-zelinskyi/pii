<?php
$sitename = 'Students';
require APPROOT . '/views/inc/head.php';
require APPROOT . '/views/inc/header.php';
require APPROOT . '/views/inc/nav.php';
?>

<main>
  <?php flash('profileEdit_success'); ?>
  <h1>Students</h1>
  <button id="new-student" aria-label="Add new student">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="40px"
      viewBox="0 -960 960 960"
      width="40px"
      fill="#e3e3e3">
      <path
        d="M440-280h80v-160h160v-80H520v-160h-80v160H280v80h160v160Zm40 200q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
    </svg>
  </button>

  <div class="modal-add-edit-window">
    <div class="modal-content">
      <div class="modal-head">
        <h2 class="modal-h2">Add student</h2>
        <span class="modal-close">&times;</span>
      </div>
      <form class="add-edit-student-form">
        <div class="input-group">
          <label for="studygroup">Group</label>
          <div class="select-container">
            <select id="studygroup" name="studygroup" required>
              <option value="">-- Choose an option --</option>
              <option value="PZ-24">PZ-24</option>
              <option value="PZ-25">PZ-25</option>
              <option value="PZ-26">PZ-26</option>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3">
                <path d="M480-360 280-560h400L480-360Z"></path>
              </svg>
            </select>
          </div>
          <span class="error-message"></span>
        </div>
        <div class="input-group">
          <label for="first-name">First name</label>
          <input
            type="text"
            id="first-name"
            name="first-name"
            minlength="2" />
          <span class="error-message"></span>
        </div>
        <div class="input-group">
          <label for="last-name">Last name</label>
          <input
            type="text"
            id="last-name"
            name="last-name"
            minlength="2" />
          <span class="error-message"></span>
        </div>
        <div class="input-group">
          <label for="gender">Gender</label>
          <select id="gender" name="gender">
            <option value="">-- Choose an option --</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <span class="error-message"></span>
        </div>
        <div class="input-group">
          <label for="birthday">Birthday</label>
          <input
            type="date"
            id="birthday"
            name="birthday"
            min="1910-01-01" />
          <span class="error-message"></span>
        </div>

        <input
          type="submit"
          id="submit"
          class="modal-create modal-button"
          value="Add" />
        <button class="modal-cancel modal-button">Cancel</button>
      </form>
    </div>
  </div>

  <div class="modal-delete-window">
    <div class="modal-content">
      <div class="modal-head">
        <h2>Delete student</h2>
        <span class="modal-close">&times;</span>
      </div>
      <p id="modal-sure">Are you sure you want to delete this students?</p>
      <p id="list-of-users-to-del"></p>
      <button class="modal-delete modal-button">Ok</button>
      <button class="modal-cancel modal-button">Cancel</button>
    </div>
  </div>

  <table id="student-table">
    <thead>
      <tr>
        <th aria-label="Select all items">
          <input
            type="checkbox"
            id="main-checkbox"
            aria-label="Select all items" />
        </th>
        <th>Group</th>
        <th>Name</th>
        <th>Gender</th>
        <th>Birthday</th>
        <th>Status</th>
        <th>Options</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($data['rows'] as $row): ?>
        <tr>
          <td data-cell="check">
            <input
              type="checkbox"
              class="checkbox"
              aria-label="Select item" />
          </td>
          <td data-cell="studygroup"><?php echo $row->studygroup; ?></td>
          <td data-cell="name"><?php echo $row->firstname . ' ' . $row->lastname; ?></td>
          <td data-cell="gender"><?php echo $row->gender; ?></td>
          <td data-cell="birthday"><?php echo $row->birthday; ?></td>
          <td data-cell="status">
            <p>Online</p>
            <svg
              class="status-indicator"
              width="20"
              height="20"
              viewBox="0 0 10 10">
              <circle
                class="status-circle"
                cx="5"
                cy="5"
                r="4"
                fill="#4CAF50" />
              <!-- #4CAF50 #F44336 -->
            </svg>
          </td>
          <td data-cell="options">
            <button disabled class="table-button edit" aria-label="Edit">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3">
                <path
                  d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
              </svg>
            </button>
            <button disabled class="table-button delete" aria-label="Delete">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3">
                <path
                  d="M640-520v-80h240v80H640Zm-280 40q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm80-80h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T440-640q0-33-23.5-56.5T360-720q-33 0-56.5 23.5T280-640q0 33 23.5 56.5T360-560Zm0-80Zm0 400Z" />
              </svg>
            </button>
          </td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
  <div class="pagination">
    <a href="#">&laquo;</a>
    <a href="#" class="active">1</a>
    <a href="#">2</a>
    <a href="#">3</a>
    <a href="#">4</a>
    <a href="#">5</a>
    <a href="#">6</a>
    <a href="#">&raquo;</a>
  </div>
</main>

<?php require APPROOT . '/views/inc/footer.php'; ?>