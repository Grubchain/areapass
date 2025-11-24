import {LoadingOverlay} from "@mantine/core";

interface LoadingMaskProps {
    margin?: number | string,
    active?: Boolean
}

export const LoadingMaskPlain = ({margin = '5px', active = false}: LoadingMaskProps) => {
    const isFetching = active;

    return (
        <div style={{margin: margin}}>
            <LoadingOverlay loaderProps={{
                size: 30,
                type: 'dots',
            }} visible={isFetching > 0}/>
        </div>
    )
}
