/**
 * FAQ Accordion — Expand/collapse with single-open behavior
 */

function initFAQAccordion() {
  const triggers = document.querySelectorAll('.accordion__trigger');
  if (!triggers.length) return;

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      const content = document.getElementById(trigger.getAttribute('aria-controls'));
      if (!content) return;

      // Close all others
      triggers.forEach(other => {
        if (other !== trigger) {
          closeAccordionItem(other);
        }
      });

      // Toggle current
      if (isExpanded) {
        closeAccordionItem(trigger);
      } else {
        openAccordionItem(trigger, content);
      }
    });
  });
}

function openAccordionItem(trigger, content) {
  trigger.setAttribute('aria-expanded', 'true');
  content.style.maxHeight = content.scrollHeight + 'px';
}

function closeAccordionItem(trigger) {
  const contentId = trigger.getAttribute('aria-controls');
  const content = document.getElementById(contentId);
  if (!content) return;

  trigger.setAttribute('aria-expanded', 'false');
  content.style.maxHeight = '0';
}
