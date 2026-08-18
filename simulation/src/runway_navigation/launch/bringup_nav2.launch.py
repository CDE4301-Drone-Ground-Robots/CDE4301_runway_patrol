import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration

def generate_launch_description():
    pkg_nav = get_package_share_directory('runway_navigation')
    pkg_nav2_bringup = get_package_share_directory('nav2_bringup')

    use_sim_time = LaunchConfiguration('use_sim_time', default='true')
    map_yaml_file = LaunchConfiguration('map', default=os.path.join(pkg_nav, 'maps', 'runway_map.yaml'))
    params_file = LaunchConfiguration('params_file', default=os.path.join(pkg_nav, 'config', 'nav2_params.yaml'))

    # Localization: map_server + amcl
    localization_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_nav2_bringup, 'launch', 'localization_launch.py')
        ),
        launch_arguments={
            'use_sim_time': use_sim_time,
            'map': map_yaml_file,
            'params_file': params_file,
            'autostart': 'true',
            'use_composition': 'False',
        }.items()
    )

    # Navigation: custom launch without route_server and docking_server
    navigation_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_nav, 'launch', 'runway_navigation_launch.py')
        ),
        launch_arguments={
            'use_sim_time': use_sim_time,
            'params_file': params_file,
            'autostart': 'true',
            'use_composition': 'False',
        }.items()
    )

    return LaunchDescription([
        DeclareLaunchArgument('use_sim_time', default_value='true', description='Use simulation clock'),
        DeclareLaunchArgument('map', default_value=map_yaml_file, description='Full path to map yaml file'),
        DeclareLaunchArgument('params_file', default_value=params_file, description='Full path to nav2 param file'),
        localization_launch,
        navigation_launch,
    ])


