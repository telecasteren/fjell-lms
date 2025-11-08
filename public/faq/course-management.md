# Course Management (Authors)

## How do I create a new course?

As an Author, go to the "Courses" page and click "Create Course". Fill in the course details and start adding modules and lessons.

## How do I add modules to a course?

After creating a course, click "Manage" to access the course management interface. Click "Next" to add modules and organize your content.

## How do I add lessons to modules?

In the course management interface, expand a module and click "Add Lesson" to create new lessons. You can also edit existing lessons by clicking "Edit".

### Creating Lesson Content

When creating or editing a lesson, you'll see two tabs:

1. **Content Tab**: 
   - Enter the lesson title
   - Select the content type (Text Editor, SCORM, or Multimedia)
   - For **Text Editor** content:
     - Use the rich text editor toolbar to format your content
     - Click formatting buttons (Bold, Italic, Underline, Headings, Lists, Links)
     - Type directly in the editor - formatting is applied in real-time
     - Content is automatically saved as HTML when you save the lesson
   - For **Multimedia** content:
     - Upload video, audio, or interactive files
     - Files are stored securely and delivered via CDN

2. **Quiz Tab**:
   - Add quiz questions with multiple answer options
   - Choose question types: Single Choice (Radio), Multiple Choice (Checkbox), or Short Text Answer
   - Mark correct answers for each question

## How do I add quizzes to lessons?

When editing a lesson, switch to the "Quiz" tab to add questions and answer options. 

### Quiz Question Types

You can create three types of questions:

1. **Single Choice (Radio)**: Students select one correct answer from multiple options
2. **Multiple Choice (Checkbox)**: Students can select multiple correct answers
3. **Short Text Answer**: Students type their answer in a text field (case-insensitive matching)

For each question:
- Enter the question text
- Add answer options (for radio/checkbox questions)
- Mark which answers are correct
- Students need 70% correct to pass the quiz

## Can I delete courses?

Yes, as an Author you can delete courses you've created. Note that this will also delete all associated modules, lessons, and quizzes.

## How do I publish a course?

In the course management interface, change the course status from "Draft" to "Published" to make it available to users.

## Can I archive courses?

Yes, you can set a course status to "Archived" to hide it from BASIC and ADMIN users while keeping it visible to Authors.

## How does the dashboard progress tracking work?

The dashboard uses different logic for displaying course progress to help users prioritize their learning:

### Ongoing Courses
- **Definition**: All courses where the user has completed at least one lesson but hasn't finished the entire course
- **Display**: Shows ALL ongoing courses in a list format
- **Purpose**: Gives users an overview of all courses they're actively working on

### Current Course in Focus
- **Definition**: The SINGLE ongoing course with the highest completion percentage
- **Display**: Shows ONE course prominently with special blue styling and a "Continue Learning" button
- **Purpose**: Highlights the course the user is most likely to continue working on

### Example Scenario
If a user has:
- Course A: 80% complete (8/10 lessons)
- Course B: 30% complete (3/10 lessons)  
- Course C: 60% complete (6/10 lessons)

Then:
- **Ongoing Courses**: Shows A, B, and C
- **Current Course in Focus**: Shows only Course A (highest percentage)

This design helps users prioritize their learning by highlighting the course they're closest to completing.
