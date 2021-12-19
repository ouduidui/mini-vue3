import {ComponentInternalInstance, Data} from "./component";

export function initProps(
    instance: ComponentInternalInstance,
    rawProps: Data | null) {
    if(rawProps) {
        instance.props = rawProps;
    }
}
