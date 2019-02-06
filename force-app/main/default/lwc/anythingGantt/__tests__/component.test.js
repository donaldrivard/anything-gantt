// createElement is what we'll use to create our component under test
import { createElement } from 'lwc';

// Import module under test by convention <namespace>/<moduleName>
import anythingGantt from 'c/anythingGantt';

describe('component-level tests', () => {
    it('loads the component with defaults', () => {
        const element = createElement('c-anything-gantt', { is: anythingGantt });
        document.body.appendChild(element);
    });
});
