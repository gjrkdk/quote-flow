import { useBlocker } from "@remix-run/react";
import { Modal, Text } from "@shopify/polaris";

interface UnsavedChangesPromptProps {
  isDirty: boolean;
}

export function UnsavedChangesPrompt({ isDirty }: UnsavedChangesPromptProps) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  if (blocker.state !== "blocked") return null;

  return (
    <Modal
      open={true}
      onClose={() => blocker.reset?.()}
      title="Unsaved changes"
      primaryAction={{
        content: "Leave page",
        onAction: () => blocker.proceed?.(),
        destructive: true,
      }}
      secondaryActions={[
        {
          content: "Stay",
          onAction: () => blocker.reset?.(),
        },
      ]}
    >
      <Modal.Section>
        <Text as="p">
          You have unsaved changes. Are you sure you want to leave?
        </Text>
      </Modal.Section>
    </Modal>
  );
}
