/*
 * Copyright (c) 2025 michioxd
 * Released under GNU General Public License 3.0. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { Flex, Switch, Text } from "@radix-ui/themes";

const Title = ({ label, description }: { label: React.ReactNode; description: React.ReactNode }) => {
    return (
        <Flex direction="column" gap="0" style={{ width: "100%" }}>
            <Text size="2" weight="bold">
                {label}
            </Text>
            <Text size="1" color="gray">
                {description}
            </Text>
        </Flex>
    );
};

export const SettingSwitch = ({
    checked,
    onCheckedChange,
    label,
    description,
    disabled,
}: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    label: React.ReactNode;
    description: React.ReactNode;
    disabled?: boolean;
}) => {
    return (
        <Flex direction="row" gap="1" style={{ width: "100%" }} align="center">
            <Title label={label} description={description} />
            <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
        </Flex>
    );
};

export const SettingContainer = ({
    children,
    label,
    description,
}: {
    children: React.ReactNode;
    label: React.ReactNode;
    description: React.ReactNode;
}) => {
    return (
        <Flex direction="column" gap="2" style={{ width: "100%" }}>
            <Title label={label} description={description} />
            {children}
        </Flex>
    );
};
